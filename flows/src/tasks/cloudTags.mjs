'use strict';

import { promisify } from 'util';
import xmlLib from 'xml-js-builder';
import WebDavLib from 'webdav-client';
import { cloud as CloudCredentials } from '../basics/credentials.mjs';

const { XML, XMLElementBuilder } = xmlLib;
const { Connection : WebDavClient, BasicAuthenticator } = WebDavLib;

const createClientOptions = () => {
  const { url, username, password } = CloudCredentials;

  return {
    url:           `${url}/remote.php/dav/files/${username}`,
    authenticator: new BasicAuthenticator(),
    username,
    password
  };
};

const client = new WebDavClient(createClientOptions());
const tagProperties = [
  'display-name', 'user-visible', 'user-assignable', 'can-assign'
];
const fileProperties = ['fileid'];
const toCamelCase = (label) => label.replace(/-./, (match) => match.charAt(1).toUpperCase());
const toType = (value) => value === null || value.length === 0
  ? null
  : value === 'true'
    ? true
    : value === 'false'
      ? false
      : isNaN(value)
        ? value
        : parseInt(value);

const asyncReaddir = promisify(client.readdir.bind(client));
const requestWrapper = (options, callback) =>
  client.request(options, (error, header, body) => callback(error, { header, body }));
const asyncRequest = promisify(requestWrapper.bind(client));

const propFindBody = (props) => {
  const findProps = new XMLElementBuilder(
    'd:propfind',
    { 'xmlns:d': 'DAV:' }
  );

  const xmlProp = findProps.ele('d:prop');

  const properties = props.map((tagInfo) =>
    ({
      namespace: 'http://owncloud.org/ns',
      namespaceShort: 'oc',
      element: tagInfo
    }));

  const namespaces = [];
  properties.forEach((property) => {
    const { namespaceShort, namespace } = property;
    if (!namespaces.find(item => item.namespaceShort === namespaceShort)) {
      namespaces.push({ namespace, namespaceShort });
    }
  });
  namespaces.forEach(item => {
    if (item.namespaceShort !== 'd') {
      findProps.attributes[`xmlns:${item.namespaceShort}`] = item.namespace;
    }
  });

  properties.forEach(property => {
    xmlProp.ele(`${property.namespaceShort}:${property.element}`);
  });
  return [findProps, namespaces];
};

const parseHref = (responseElement) => {
  const hrefs = responseElement.find('DAV:href').findTexts()
    .flat()
    .filter(href => !href.endsWith('/'));
  return hrefs.length > 0 ? hrefs[0] : null;
};

const parseProperties = (responseElement, namespaces) =>
  responseElement.find('DAV:propstat').find('DAV:prop').elements
    .map((element) => {
      let name = element.name;
      if (typeof name === 'string') {
        const namespaceCandidate = namespaces
          .find(extraProperty => name.startsWith(extraProperty.namespace));
        if (namespaceCandidate) {
          name = toCamelCase(name.substring(namespaceCandidate.namespace.length));
        }
        if (name === 'fileid') {
          name = 'id';
        }
        if (name === 'displayName') {
          name = 'name';
        }
      }
      const value = element.elements.length === 1 && element.elements[0].type === 'text'
        ? element.elements[0].text
        : null;
      return {
        [name]: toType(value)
      };
    })
    .reduce((props, item) => Object.assign({}, props, item), {});

const getTags = async (fileId) => {
  if (typeof fileId !== 'undefined' && typeof fileId !== 'number') {
    return Promise.reject(new TypeError('fileId should be a number'));
  }
  const [findProps, namespaces] = propFindBody(tagProperties);

  const url = typeof fileId === 'undefined'
    ? `${CloudCredentials.url}/remote.php/dav/systemtags/`
    : `${CloudCredentials.url}/remote.php/dav/systemtags-relations/files/${fileId}`;

  await asyncReaddir('/').catch(_error => Promise.resolve(false));
  const response = await asyncRequest({
    url,
    method: 'PROPFIND',
    body: findProps.toXML()
  }).catch(error => Promise.resolve(error));
  const { header, body } = response;
  if (header.statusCode >= 400) {
    return Promise.resolve(new Error(header));
  }
  let result;
  try {
    result = XML.parse(Buffer.isBuffer(body) ? Int8Array.from(body) : body)
      .find('DAV:multistatus')
      .findMany('DAV:response')
      .map(response => {
        const href = parseHref(response);
        if (!href) {
          return { id: null };
        }
        const id = toType(href.substring(href.lastIndexOf('/') + 1));
        const properties = parseProperties(response, namespaces);
        return {
          id,
          href,
          ...properties
        };
      })
      .filter(item => item.id !== null);
  } catch (error) {
    result = error;
  }
  return Promise.resolve(result);
};

const createTag = async (tagLabel) => {
  if (typeof tagLabel !== 'string') {
    return Promise.reject(new TypeError('tagLabel should be a string'));
  }
  const properties = tagProperties.map(toCamelCase).map((property) =>
    property === 'displayName'
      ? { name: tagLabel }
      : { [property]: true }
  ).reduce((props, item) => Object.assign({}, props, item), {});
  const serializedProps = JSON.stringify(properties);

  const response = await asyncRequest({
    url: `${CloudCredentials.url}/remote.php/dav/systemtags/`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Content-Length': serializedProps.length
    },
    body: serializedProps
  }).catch(error => Promise.resolve(error));
  if (response instanceof Error) {
    return Promise.resolve(response);
  }
  const { header } = response;
  const { statusCode, headers } = header;
  if (statusCode === 409) { // conflict => already exists
    const existingTags = await getTags();
    if (!(existingTags instanceof Error)) {
      const tagCandidate = existingTags.find(item => `${item.name}` === tagLabel);
      if (tagCandidate) {
        return Promise.resolve(tagCandidate);
      }
    }
  }
  if (statusCode >= 400) {
    return Promise.resolve(new Error(header));
  }
  properties.id = parseInt(headers['content-location']
    .substring(headers['content-location'].lastIndexOf('/') + 1));
  return Promise.resolve(properties);
};

const setTag = async (fileId, tagId) => {
  if (typeof fileId !== 'number') {
    return Promise.reject(new TypeError('fileId should be a number'));
  }
  if (typeof tagId !== 'number') {
    return Promise.reject(new TypeError('tagId should be a number'));
  }

  const response = await asyncRequest({
    url: `${CloudCredentials.url}/remote.php/dav/systemtags-relations/files/${fileId}/${tagId}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Content-Length': 0
    }
  }).catch(error => Promise.resolve(error));
  const { header } = response;
  return Promise.resolve(header.statusCode >= 400
    ? new Error(header)
    : null
  );
};

const getFileProps = async (filePath, includeTags = false) => {
  if (typeof filePath !== 'string') {
    return Promise.reject(new TypeError('filePath should be a string'));
  }
  if (typeof includeTags !== 'boolean') {
    return Promise.reject(new TypeError('includeTags should be a boolean'));
  }
  const [findProps, namespaces] = propFindBody(fileProperties);

  const response = await asyncRequest({
    url: filePath,
    method: 'PROPFIND',
    body: findProps.toXML()
  }).catch(error => Promise.resolve(error));
  const { header, body } = response;
  if (header.statusCode >= 400) {
    return Promise.resolve(new Error(header));
  }
  let result;
  try {
    const responseElement = XML.parse(Buffer.isBuffer(body) ? Int8Array.from(body) : body)
      .find('DAV:multistatus')
      .find('DAV:response');
    const href = parseHref(responseElement);
    if (!href) {
      return { id: null };
    }
    const properties = parseProperties(responseElement, namespaces);
    result = {
      href,
      ...properties
    };
  } catch (error) {
    return Promise.resolve(error);
  }
  if (includeTags) {
    const tags = await getTags(result.id);
    if (!(tags instanceof Error)) {
      Object.assign(result, { tags });
    }
  }
  return Promise.resolve(result);
};

export default {
  getTags,
  createTag,
  setTag,
  getFileProps
};
