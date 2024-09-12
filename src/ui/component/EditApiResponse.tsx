import { Button, Drawer, Form, Input, Space } from 'antd';
import React, { useState } from 'react';
import { AddHttpMockResponse } from '../../sdk/common/types';
import useMockForgeStore from '../model/state';
import { JSONEditor } from './JsonEditor';
import { requestMatcherSchema } from '../schema.ts';

const { TextArea } = Input;

export const AddMockResponseButton: React.FC<{
  method: string;
  pathname: string;
}> = ({ method, pathname }) => {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  const addHttpMockResponse = useMockForgeStore((state) => state.addHttpMockResponse);

  const showDrawer = () => {
    setIsDrawerVisible(true);
  };

  const handleCancel = () => {
    setIsDrawerVisible(false);
    form.resetFields();
  };

  const onFinish = async (values: any) => {
    const newMockResponse: AddHttpMockResponse = {
      name: values.name,
      schema: 'http_response_v1',
      description: values.description,
      requestMatcher: values.matchJson
        ? {
            type: 'basic-match',
            content: JSON.parse(values.matchJson),
          }
        : null,
      responseData: {
        type: 'json',
        content: JSON.parse(values.responseJson),
      },
    };
    await addHttpMockResponse(method, pathname, newMockResponse);
    setIsDrawerVisible(false);
    form.resetFields();
  };

  return (
    <>
      <Button type="primary" onClick={showDrawer}>
        Add Mock Response
      </Button>
      <Drawer
        title="Add Mock Response"
        placement="right"
        onClose={handleCancel}
        open={isDrawerVisible}
        destroyOnClose
        width={600}
        extra={
          <Space>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button type="primary" onClick={form.submit}>
              Submit
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          onFinish={onFinish}
          layout="vertical"
          initialValues={{
            responseJson: '{\n}',
          }}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please input the name' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="matchJson" label="Request Match">
            <JSONEditor schema={requestMatcherSchema}></JSONEditor>
          </Form.Item>
          <Form.Item
            name="responseJson"
            label="Response"
            rules={[
              { required: true, message: 'Please input the response JSON' },
              {
                message: 'Please input a valid JSON',
                validator: (_, value) => {
                  try {
                    JSON.parse(value);
                    return Promise.resolve();
                  } catch (e) {
                    return Promise.reject('Invalid JSON');
                  }
                },
              },
            ]}
          >
            <JSONEditor></JSONEditor>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};
