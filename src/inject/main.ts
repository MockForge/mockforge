import { info } from './logger';
import { BrowserMockForgeEventListener } from '../ui/service/event';
import { BrowserMockForgeStateService } from '../ui/service/service';
import { getInitialStateSync } from './getInitialStateSync';
import { patchXMLHttpRequest } from './patchXMLHttpRequest';
import { RequestSimulator } from './RequestSimulator';
import { patchFetch } from './patchFetch.ts';

async function initAndInject() {
  info('MockForge initializing');
  const requestSimulatorElement = document.getElementById('mock-forge-request-simulator');
  if (!requestSimulatorElement) {
    console.error('Mockforge Request Simulator: Script tag not found');
    return;
  }
  const clientId = requestSimulatorElement.getAttribute('clientId');
  const serverURL = requestSimulatorElement.getAttribute('serverURL');
  if (!clientId || !serverURL) {
    return;
  }
  const requestSimulator = new RequestSimulator(location.origin);
  try {
    const initState = getInitialStateSync(serverURL, clientId);
    requestSimulator.setApiList(initState.mockAPIs);
    requestSimulator.setState(initState.mockState);
    //拦截 xml
    patchXMLHttpRequest(requestSimulator);
    patchFetch(requestSimulator);
  } catch (error) {
    console.error('Mockforge Request Simulator: Failed to get mock state', error);
  }

  try {
    const browserMockForgeEventListener = new BrowserMockForgeEventListener(serverURL, clientId);
    const browserMockForgeStateService = new BrowserMockForgeStateService(serverURL, clientId);
    await browserMockForgeEventListener.connect();
    browserMockForgeEventListener.handleEvent((event) => {
      if (event.type === 'http-mock-api-change') {
        browserMockForgeStateService.listMockAPIs().then((state) => {
          requestSimulator.setApiList(state);
        });
      }
      if (event.type === 'mock-forge-state-change') {
        browserMockForgeStateService.getMockForgeState().then((state) => {
          requestSimulator.setState(state);
        });
      }
    });
  } catch (error) {
    console.error('Mockforge Request Simulator: Failed to get mock state', error);
  }
  info(`MockForge initialized, Access ${serverURL} to manage mock data`);
}

initAndInject();
