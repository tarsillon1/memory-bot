function GetProcessInfoByName
{
    param
    ([string]$processName)

    Get-WmiObject -class Win32_PerfFormattedData_PerfProc_Process | where{$_.name -like $processName+"*"} | select `
    @{Name="Process Id"; Expression = {$_.idprocess}},`
    @{Name="Counter Name"; Expression = {$_.name}},`
    @{Name="Private Working Set"; Expression = {$_.workingSetPrivate / 1kb}}
}
GetProcessInfoByName $processName;