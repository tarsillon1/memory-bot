on run argv
    tell application (item 1 of argv)

        activate

        delay 1

        tell application "System Events" to tell process (item 1 of argv)

            set value of attribute "AXFullScreen" of window 1 to true

        end tell

    end tell
end run