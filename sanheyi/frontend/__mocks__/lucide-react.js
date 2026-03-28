import React from 'react';
const Lucide = new Proxy({}, {
  get: (target, prop) => (props) => React.createElement('svg', { ...props, 'data-testid': `lucide-${prop}` })
});
module.exports = Lucide;