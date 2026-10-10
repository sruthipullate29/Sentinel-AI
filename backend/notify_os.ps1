param(
    [string]$Title = "Vision404 - Anomaly Detected",
    [string]$Body = "High risk system pressure detected"
)

try {
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

    $xml = [Windows.Data.Xml.Dom.XmlDocument]::new()
    $escapedTitle = [System.Security.SecurityElement]::Escape($Title)
    $escapedBody = [System.Security.SecurityElement]::Escape($Body)

    $template = @"
<toast scenario="reminder">
    <visual>
        <binding template="ToastGeneric">
            <text>$escapedTitle</text>
            <text>$escapedBody</text>
        </binding>
    </visual>
    <audio src="ms-winsoundevent:Notification.Default" />
</toast>
"@

    $xml.LoadXml($template)
    $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
    $toast.Priority = [Windows.UI.Notifications.ToastNotificationPriority]::High

    $notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('windows.immersivecontrolpanel_cw5n1h2txyewy!microsoft.windows.immersivecontrolpanel')
    $notifier.Show($toast)
    Write-Output "SUCCESS: Toast shown via Windows immersivecontrolpanel"
} catch {
    Write-Error $_
}
