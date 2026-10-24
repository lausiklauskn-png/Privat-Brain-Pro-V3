; Per-user "Open with" registration. Does not change any default association.
!macro NSIS_HOOK_POSTINSTALL
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-v3.exe" "FriendlyAppName" "Private Brain V3 Pro"
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-v3.exe\shell\open\command" "" '$\"$INSTDIR\private-brain-v3.exe$\" $\"%1$\"'
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-v3.exe\DefaultIcon" "" '$\"$INSTDIR\private-brain-v3.exe$\",0'
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-v3.exe\SupportedTypes" ".pdf" ""
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-v3.exe\SupportedTypes" ".txt" ""
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-v3.exe\SupportedTypes" ".csv" ""
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-v3.exe\SupportedTypes" ".eml" ""
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-v3.exe\SupportedTypes" ".mbox" ""
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-v3.exe\SupportedTypes" ".docx" ""
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-v3.exe\SupportedTypes" ".xlsx" ""
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-v3.exe\SupportedTypes" ".png" ""
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-v3.exe\SupportedTypes" ".jpg" ""
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  DeleteRegKey HKCU "Software\Classes\Applications\private-brain-v3.exe"
!macroend
