import '@testing-library/jest-dom';

if (!global.fetch) {
    global.fetch = require('node-fetch');
}
