import { Alert } from 'react-native';
import { confirmDelete } from '../../src/utils/dialogs';

jest.spyOn(Alert, 'alert');

describe('confirmDelete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows an alert with the item name', () => {
    confirmDelete('my-server', jest.fn());
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete',
      'Delete "my-server"? This cannot be undone.',
      expect.any(Array),
    );
  });

  it('alert has Cancel and Delete buttons', () => {
    confirmDelete('vol-01', jest.fn());
    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    expect(buttons[0]).toMatchObject({ text: 'Cancel', style: 'cancel' });
    expect(buttons[1]).toMatchObject({ text: 'Delete', style: 'destructive' });
  });

  it('calls onConfirm when Delete is pressed', async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    confirmDelete('fw-01', onConfirm);
    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    await buttons[1].onPress();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows error alert if onConfirm rejects', async () => {
    const onConfirm = jest.fn().mockRejectedValue(new Error('API error'));
    confirmDelete('net-01', onConfirm);
    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    await buttons[1].onPress();
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'API error');
  });
});
