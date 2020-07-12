'use strict';

import cloud from './cloud.mjs';
import cloudTags from './cloudTags.mjs';

const context = {
  flow: {
    folder: {
      location: '/test'
    },
    file: {
      derived: {
        tagsOrg: ['testWim']
      },
      tempPathEdit: '/home/wim/temp/IMG_0706.JPG'
    }
  }
};

const next = () => { };

const start = async () => {
  const tags = await cloudTags.getTags();
  // cloud.addTags(context, next);
};

start();
