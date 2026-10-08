import RestrictedIOPlugin from './RestrictedIOPlugin';
import restrictedModdle from './restricted.json';

export default {
  __init__: [ 'RestrictedIOPlugin' ],
  RestrictedIOPlugin: [ 'type', RestrictedIOPlugin ],
  moddleExtensions: {
    restricted: restrictedModdle
  }
};
