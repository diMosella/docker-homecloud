'use strict';

import NextcloudClient from 'nextcloud-link';

// Supply a configuration object to NextcloudClient to
// set-up the connection
const client = NextcloudClient({
    url: 'http://localhost:16000',
    username: 'example',
    password: 'example'
});

    // Managing files folders is just as easy
    await this.client.touchFolder('/example');

    // Add a file with content.
    // The content argument can be either a string or a Buffer.
    await this.client.put('/example/file.txt', 'Hello!');
    await this.client.move('/example', '/otherlocation');

    // And we can get the content back from the new location
    const content = await this.client.getReadStream('/otherlocation/file.txt');
    // Or simply as a string
    const text = await this.client.get('/otherlocation/file.txt');
