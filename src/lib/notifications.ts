import axios from '@/lib/axios';

interface NotificationData {
  title: string;
  body: string;
  type: string;
  // Removed data field since we're now using body as the data string
}

/**
 * Clean up expired push subscriptions
 * @returns Promise that resolves when cleanup is complete
 */
// export const cleanupExpiredSubscriptions = async (): Promise<void> => {
//   try {
//     const response = await axios.post('/api/push-subscription/cleanup');
    
//     if (response.status === 200) {
//       console.log('✅ Subscription cleanup completed:', response.data);
//     } else {
//       console.error('❌ Failed to cleanup subscriptions:', response.statusText);
//     }
//   } catch (error) {
//     console.error('❌ Error during subscription cleanup:', error);
//   }
// };

/**
 * Send a notification using the push notification API
 * @param notificationData - The notification data to send
 * @returns Promise that resolves when notification is sent
 */
export const sendNotification = async (notificationData: NotificationData): Promise<void> => {
  try {
    const response = await axios.post('/api/send-push', notificationData);
    
    if (response.status === 200) {
      console.log('✅ Notification sent successfully:', notificationData);
    } else {
      console.error('❌ Failed to send notification:', response.statusText);
    }
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    // Don't throw error to prevent breaking the main operation
  }
};

/**
 * Send an order status notification
 * @param poNumber - The PO number
 * @param orderId - The order ID
 * @param actionType - The action performed
 * @param status - The new status
 */
export const sendOrderStatusNotification = async (
  poNumber: string,
  orderId: string,
  actionType: 'approve' | 'hold' | 'release' | 'complete' | 'resolve',
  status: string
): Promise<void> => {
  const notificationMessages = {
    approve: `${poNumber} has been approved and is now ready for picklist generation.`,
    hold: `${poNumber} has been placed On Hold due to stock issues.`,
    release: `${poNumber} has been released and is now approved for processing.`,
    complete: `${poNumber} has been completed successfully.`,
    resolve: `${poNumber} issue has been resolved.`
  };

  const notificationTypes = {
    approve: 'po_approved',
    hold: 'po_on_hold',
    release: 'po_released',
    complete: 'po_completed',
    resolve: 'po_resolved'
  };

  const notificationTitles = {
    approve: 'Order Approved',
    hold: 'Order On Hold',
    release: 'Order Released',
    complete: 'Order Completed',
    resolve: 'Order Resolved'
  };

  await sendNotification({
    title: notificationTitles[actionType],
    body: notificationMessages[actionType],
    type: notificationTypes[actionType]
  });
};

/**
 * Send a picklist status notification
 * @param poNumber - The PO number
 * @param orderId - The order ID
 * @param actionType - The action performed
 * @param status - The new status
 */
export const sendPicklistStatusNotification = async (
  poNumber: string,
  orderId: string,
  actionType: 'completed' | 'rollover',
  status: string
): Promise<void> => {
  const notificationMessages = {
    completed: `${poNumber} picklist has been marked as completed.`,
    rollover: `${poNumber} picklist has been rolled over to the next cycle.`
  };

  const notificationTypes = {
    completed: 'picklist_completed',
    rollover: 'picklist_rollover'
  };

  const notificationTitles = {
    completed: 'Picklist Completed',
    rollover: 'Picklist Rolled Over'
  };

  await sendNotification({
    title: notificationTitles[actionType],
    body: notificationMessages[actionType],
    type: notificationTypes[actionType]
  });
};

/**
 * Send a bulk picklist completion notification
 * @param poNumbers - Array of PO numbers
 * @param count - Number of orders completed
 */
export const sendBulkPicklistNotification = async (
  poNumbers: string[],
  count: number
): Promise<void> => {
  const message = count === 1 
    ? `${poNumbers[0]} has been marked as completed.`
    : `${count} POs have been marked as completed: ${poNumbers.slice(0, 3).join(', ')}${count > 3 ? ` and ${count - 3} more` : ''}.`;

  await sendNotification({
    title: 'Picklist Bulk Update',
    body: message,
    type: 'picklist_bulk_completed'
  });
};

/**
 * Send a docket creation notification
 * @param docketId - The docket ID
 * @param poNumbers - Array of PO numbers in the docket
 * @param buyer - The buyer name
 * @param location - The location
 */
export const sendDocketCreationNotification = async (
  docketId: string,
  poNumbers: string[],
  buyer: string,
): Promise<void> => {
  const message = `Docket ${docketId} has been created for ${buyer}  with ${poNumbers.length} PO${poNumbers.length > 1 ? 's' : ''}: ${poNumbers.join(', ')}.`;

  await sendNotification({
    title: 'Docket Created',
    body: message,
    type: 'docket_created'
  });
};

export const labelNotification = async (

  poNumber: string,
): Promise<void> => {

  const message = `Label has been created for the PO ${poNumber}.`;

  await sendNotification({
    title: `Label Created`,
    body: message,
    type: `label_created`
  });
};

export const labelNotificationDocket = async (

  docketId: string,
  poNumbers: string[],
): Promise<void> => {

  const message = `Label has been created for the docket ${docketId} with POs: ${poNumbers.join(', ')}.`;

  await sendNotification({
    title: `Label Created`,
    body: message,
    type: `label_created`
  });
};

export const awbNotification = async (

  awbNumber: string,
  poNumber: string,
): Promise<void> => {

  const message = `AWB number ${awbNumber} has been added. Shipping Manifest created for the PO ${poNumber}.`;

  await sendNotification({
    title: `AWB Number added`,
    body: message,
    type: `awb_created`
  });
};

export const awbNotificationDocket = async (

  docketId: string,
  poNumbers: string[],
): Promise<void> => {

  const message = `AWB numbers have been added for the docket ${docketId}. Shipping Manifest created for ${poNumbers.length} POs: ${poNumbers.join(', ')}.`;

  await sendNotification({
    title: `AWB Numbers added`,
    body: message,
    type: `awb_created`
  });
};
