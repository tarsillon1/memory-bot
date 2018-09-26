param ([string]$processName)
Add-Type @"
  using System;
  using System.Runtime.InteropServices;
  public class SFW {
     [DllImport("user32.dll")]
     [return: MarshalAs(UnmanagedType.Bool)]
     public static extern bool SetForegroundWindow(IntPtr hWnd);
  }
"@


(Get-Process $processName) | foreach {
    [SFW]::SetForegroundWindow($_.MainWindowHandle)
}