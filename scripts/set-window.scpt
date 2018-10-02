on run argv
  tell application (item 1 of argv)

  activate

  delay 1

    tell application "System Events" to tell process (item 1 of argv)
      set width to item 4 of argv
      set height to item 5 of argv

      set x1 to item 2 of argv
      set y1 to item 3 of argv

      set position of window 1 to {x1, y1}
      set size of window 1 to {width, height}

    end tell

  end tell
end run