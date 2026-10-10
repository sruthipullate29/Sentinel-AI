[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

$xml = [Windows.Data.Xml.Dom.XmlDocument]::new()
$xml.LoadXml(@"
<toast scenario="reminder">
    <visual>
        <binding template="ToastGeneric">
            <text>Vision404 — System Reliability Alert</text>
            <text>Live Anomaly Detected: Chrome Memory Spike (Risk: 86%)</text>
        </binding>
    </visual>
    <audio src="ms-winsoundevent:Notification.Default" />
</toast>
"@)

$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
$toast.Priority = [Windows.UI.Notifications.ToastNotificationPriority]::High

$notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("windows.immersivecontrolpanel_cw5n1h2txyewy!microsoft.windows.immersivecontrolpanel")
$notifier.Show($toast)
Write-Output "OK: Windows OS toast delivered successfully via immersivecontrolpanel"
