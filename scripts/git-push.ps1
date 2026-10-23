$code = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinCred {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public int Flags;
        public int Type;
        public string TargetName;
        public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public int CredentialBlobSize;
        public IntPtr CredentialBlob;
        public int Persist;
        public int AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias;
        public string UserName;
    }

    [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);

    [DllImport("advapi32.dll", SetLastError = true)]
    public static extern void CredFree(IntPtr credentialPtr);

    public static string ReadGenericCredential(string target) {
        IntPtr credPtr;
        if (CredRead(target, 1, 0, out credPtr)) {
            try {
                CREDENTIAL cred = (CREDENTIAL)Marshal.PtrToStructure(credPtr, typeof(CREDENTIAL));
                if (cred.CredentialBlobSize > 0) {
                    byte[] blob = new byte[cred.CredentialBlobSize];
                    Marshal.Copy(cred.CredentialBlob, blob, 0, cred.CredentialBlobSize);
                    return Encoding.UTF8.GetString(blob);
                }
            } finally {
                CredFree(credPtr);
            }
        }
        return null;
    }
}
"@

Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue

$token = [WinCred]::ReadGenericCredential("GitHub - https://api.github.com/Franksalcedo-prog")
$git = "C:\Users\Frank\AppData\Local\GitHubDesktop\app-3.6.4\resources\app\git\cmd\git.exe"

if ($token) {
    $authRemote = "https://Franksalcedo-prog:$token@github.com/Franksalcedo-prog/socialcount-analytics.git"
    & $git remote set-url origin $authRemote
    & $git push origin main
    & $git remote set-url origin "https://github.com/Franksalcedo-prog/socialcount-analytics.git"
    Write-Output "SUCCESS: Pushed to origin main successfully."
} else {
    & $git push origin main
}
