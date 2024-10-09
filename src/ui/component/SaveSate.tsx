import { SaveOutlined } from '@ant-design/icons';
import { Button, Input, Modal, message } from 'antd';
import React, { useState } from 'react';
import useMockForgeStore, { useMockStatesStore } from '../model/state';
import { isChange } from '../../sdk/common/state';

export const SaveMockStateButton = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [inputName, setInputName] = useState('');
  const { currentMockState, saveCurrentMockState } = useMockStatesStore();
  const { mockForgeState } = useMockForgeStore();

  const handleSave = async () => {
    try {
      await saveCurrentMockState(currentMockState!);
      message.success('Mock state saved successfully!');
    } catch (error) {
      message.error('Failed to save mock state');
    }
  };

  const handleModalOk = async () => {
    if (inputName.trim()) {
      try {
        await saveCurrentMockState(inputName);
        setIsModalVisible(false);
        setInputName('');
        message.success('Mock state saved successfully!');
      } catch (error) {
        message.error('Failed to save mock state');
      }
    } else {
      message.warning('Please enter a name for the mock state.');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setInputName('');
  };

  function handleSaveAs() {
    setIsModalVisible(true);
  }

  const isMockStateSaved = isChange(mockForgeState);

  return (
    <div>
      {currentMockState && (
        <Button type="primary" icon={<SaveOutlined />} disabled={isMockStateSaved} onClick={handleSave}>
          Save
        </Button>
      )}
      <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveAs}>
        Save As
      </Button>
      <Modal title="Save Mock State" open={isModalVisible} onOk={handleModalOk} onCancel={handleModalCancel}>
        <Input value={inputName} onChange={(e) => setInputName(e.target.value)} placeholder="Enter mock state name" />
      </Modal>
    </div>
  );
};
