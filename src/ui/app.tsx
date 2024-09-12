import { useRequest } from 'ahooks';
import { Checkbox } from 'antd';
import React, { useEffect } from 'react';
import { MockAPI } from '../sdk/common/types';
import { MockForgeEvent } from '../server/common/event';
import { AddApiForm } from './component/AddApiForm';
import { AddMockResponseButton } from './component/AddApiResponse';
import './index.css';
import useMockForgeStore from './model/state';
import { EditOutlined } from '@ant-design/icons';

const APICard: React.FC<{ api: MockAPI }> = (props) => {
  const mockForgeStore = useMockForgeStore();

  return (
    <div className="api-card">
      <div className="api-header">
        <div style={{ display: 'flex' }}>
          <div className="method-tag">{props.api.method}</div>
          <div className="api-title">
            {props.api.pathname}
            <span className="api-name">{props.api.name}</span>
            <div className="api-actions">
              <AddMockResponseButton method={props.api.method} pathname={props.api.pathname} />
            </div>
          </div>
        </div>
        <div style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>{props.api.description}</div>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        {props.api.mockResponses.map((o) => (
          <div className="tag-item" key={o.name}>
            <Checkbox
              style={{ marginRight: 8 }}
              checked={mockForgeStore.isHttpApiResponseSelected(props.api.method, props.api.pathname, o.name)}
              onChange={(e) => {
                if (e.nativeEvent.altKey) {
                  mockForgeStore
                    .selectSingleHttpApiResponse(props.api.method, props.api.pathname, o.name)
                    .catch((err) => {
                      console.log(err);
                    });
                  return;
                }
                console.log(e.nativeEvent.altKey);
                mockForgeStore.toggleHttpApiResponse(props.api.method, props.api.pathname, o.name).catch((err) => {
                  console.log(err);
                });
              }}
            />
            <div className="tag-name">{o.name}</div>
            <div>
              <EditOutlined />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function useInitData(clientId: string) {
  const mockForgeStore = useMockForgeStore();

  const mockApiRequest = useRequest(
    () => {
      return mockForgeStore.browserMockForgeStateService.listMockAPIs();
    },
    {
      refreshOnWindowFocus: true,
      onSuccess(data) {
        mockForgeStore.updateApiList(data);
      },
    }
  );
  const mockForgeStateRequest = useRequest(
    () => {
      return mockForgeStore.browserMockForgeStateService.getMockForgeState();
    },
    {
      refreshOnWindowFocus: true,
      onSuccess(data) {
        mockForgeStore.updateMockForgeState(data);
      },
    }
  );
  useEffect(() => {
    const handler = (event: MockForgeEvent) => {
      if (event.type === 'http-mock-api-change') {
        mockApiRequest.refresh();
      }
      if (event.type === 'mock-forge-state-change') {
        mockForgeStateRequest.refresh();
      }
    };
    mockForgeStore.browserMockForgeEventListener.handleEvent(handler);
    return () => {
      mockForgeStore.browserMockForgeEventListener.removeEventListener(handler);
    };
  }, [clientId, mockApiRequest]);
}

export function App() {
  const mockForgeStore = useMockForgeStore();
  useInitData(mockForgeStore.clientId);
  return (
    <div style={{ padding: 20 }}>
      <div className="search-bar">
        <AddApiForm></AddApiForm>
      </div>
      {
        <div style={{ marginTop: 20 }}>
          {mockForgeStore.apiList.map((api) => (
            <APICard api={api} />
          ))}
        </div>
      }
    </div>
  );
}
