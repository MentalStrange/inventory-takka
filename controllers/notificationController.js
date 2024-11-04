import { transformationNotification } from "../format/transformationObject.js";
import Notification from "../models/notificationSchema.js";

export const getNotificationsByCustomerId = async (req, res) => {
  const customerId = req.params.id;
  try {
    const notifications = await Notification.find({
      $or: [
        { customerId: customerId },
        { type: { $in: ["addNewOffer", "addNewGroup"] } },
      ],
    }).sort({ dateTime: -1 });

    const transformNotifications = await Promise.all(
      notifications.map(async (notification) => await transformationNotification(notification))
    );
    return res.status(200).json({
      status: "success",
      data: transformNotifications,
    });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};
export const getNotificationsBySupplierId = async (req, res) => {
  const supplierId = req.params.id;
  try {
    const notifications = await Notification.find({
      supplierId: supplierId,
    }).sort({ dateTime: -1 });

    const transformNotifications = await Promise.all(
      notifications.map(async (notification) => await transformationNotification(notification))
    );
    return res.status(200).json({
      status: "success",
      data: transformNotifications,
    });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};
export const getNotificationsByDeliveryId = async (req, res) => {
  const deliveryBoyId = req.params.id;
  try {
    const notifications = await Notification.find({
      deliveryBoyId: deliveryBoyId,
    }).sort({ dateTime: -1 });

    const transformNotifications = await Promise.all(
      notifications.map(async (notification) => await transformationNotification(notification))
    );
    return res.status(200).json({
      status: "success",
      data: transformNotifications,
    });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};
export const deleteNotification = async (req, res) => {
  const notificationId = req.params.id;
  try {
    const notification = await Notification.findById(notificationId);
    if (notification.type !== "addNewOffer" && notification.type !== "addNewGroup") {
      await Notification.deleteOne({ _id: notificationId });
      res.status(204).json({
        status: "success",
        message: "Notification deleted successfully",
      });
    } else {
      res.status(204).json({
        status: "success",
        message: "Notification deleted successfully",
      });
    }
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};
