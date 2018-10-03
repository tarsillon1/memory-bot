param ([string]$processName)
$sig = '[DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);'
Add-Type -MemberDefinition $sig -name NativeMethods -namespace Win32
(Get-Process $processName) | foreach {
    [Win32.NativeMethods]::ShowWindowAsync($_.MainWindowHandle, 3)
}