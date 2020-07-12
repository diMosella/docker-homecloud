'use strict';

import { promisify } from 'util';
import xmlLib from 'xml-js-builder';
import WebDavLib from 'webdav-client';
import { cloud as CloudCredentials } from '../basics/credentials.mjs';

const { XML, XMLElementBuilder } = xmlLib;
const { Connection : WebDavClient, BasicAuthenticator } = WebDavLib;

const createClientOptions = () => {
  const { url, username, password } = CloudCredentials;
  const lastUrlCharacterIsSlash = url.slice(-1)[0] === '/';

  const terminatedUrl = lastUrlCharacterIsSlash ? url : `${url}/`;

  return {
    url:           `${terminatedUrl}remote.php/dav/files/${username}`,
    authenticator: new BasicAuthenticator(),
    username,
    password
  };
};

const client = new WebDavClient(createClientOptions());

const asyncReaddir = promisify(client.readdir.bind(client));
const requestWrapper = (options, callback) =>
  client.request(options, (error, header, body) => callback(error, { header, body }));
const asyncRequest = promisify(requestWrapper.bind(client));

const createPropFindBody = () => {
  const findProps = new XMLElementBuilder(
    'd:propfind',
    { 'xmlns:d': 'DAV:' }
  );

  const xmlProp = findProps.ele('d:prop');

  const properties = [
    'display-name', 'user-visible', 'user-assignable', 'can-assign'
  ].map((tagInfo) =>
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

const getTags = async () => {
  const [findProps, namespaces] = createPropFindBody({});

  await asyncReaddir('/').catch(_error => Promise.resolve(false));
  const response = await asyncRequest({
    url: '/remote.php/dav/systemtags/',
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
        const hrefs = response.find('DAV:href').findTexts()
          .flat()
          .filter(href => !href.endsWith('/'));
        const href = hrefs.length > 0 ? hrefs[0] : null;
        const id = href ? href.substring(href.lastIndexOf('/') + 1) : null;
        const properties = response.find('DAV:propstat').find('DAV:prop').elements
          .map((element) => {
            let name = element.name;
            if (typeof name === 'string') {
              const namespaceCandidate = namespaces
                .find(extraProperty => name.startsWith(extraProperty.namespace));
              if (namespaceCandidate) {
                const { namespace, namespaceShort } = namespaceCandidate;
                name = `${namespaceShort}:${name.substring(namespace.length)}`;
              }
            }
            const value = element.elements.length === 1 && element.elements[0].type === 'text'
              ? element.elements[0].text
              : null;
            return {
              [name]: value
            };
          })
          .reduce((props, item) => Object.assign({}, props, item), {});
        return {
          id,
          href,
          ...properties
        };
      });
  } catch (error) {
    result = error;
  }
  return Promise.resolve(result);
};

const addTag = (tagLabel) => {

};

export default {
  getTags,
  addTag
};
