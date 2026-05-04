import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import MainComponent from './main/component';

const uuid = document.currentScript?.getAttribute('uuid') || 'root';

const pluginName = document.currentScript?.getAttribute('pluginName') || 'plugin';

let active: boolean | null = null;

try {
  const parsed = JSON.parse(localStorage.getItem('pip-plugin-active'));
  if (typeof parsed === 'boolean') active = parsed;
} catch {
  active = true;
}

const root = ReactDOM.createRoot(document.getElementById(uuid));
root.render(
  <MainComponent {...{
    pluginUuid: uuid,
    pluginName,
    active,
  }}
  />,
);
