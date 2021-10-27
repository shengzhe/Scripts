#!/bin/bash
# shell strap

OSREL="$(cat /etc/os-release | grep PRETTY_NAME | cut -d'=' -f 2)"
if [[ $OSREL == "" ]]; then   ## Mac or others?
  OSREL="$(sw_vers | grep Name | cut -d':' -f 2)"
fi
SHELLTYPE="$(echo $SHELL)"

echo "====================================================="
echo -n "OS is " 
echo $OSREL

echo ""

if [[ $SHELLTYPE == *"bash"* ]]; then
  echo "It's Bash. You may want a Zsh:"

  if [[ $OSREL == *"Ubuntu"* ]]; then   ## Debian-based linux systems
    echo "  1. sudo apt-get install zsh"
  elif [[ $OSREL == *"CentOS"* ]]; then   ## Red Hat-based linux systems
    echo "  1. sudo yum install zsh"
  elif [[ $OSREL == "Mac" ]]; then
    echo "  1. brew install zsh"
  else 
    echo "  1. install zsh"
  fi

  echo "  2. install oh-my-zsh from https://ohmyz.sh/" 

  echo ""
  echo "-----------------------"
  echo ""
  echo "OR, you may want:"
  echo "  1. Add alias into ~/.bashrc"
  echo "  2. Bind arrow keys to command history in ~/.inputrc"
  echo "     \"\\e[A\": history-search-backward"
  echo "     \"\\e[B\": history-search-forward"
  echo "  3. Run this script within ~/.bashrc"
elif [[ $SHELLTYPE == *"zsh"* ]]; then
  echo "It's Zsh. You may want to: "
  echo "  1. Add alias into ~/.zshrc"
  echo "  2. Run this script within ~/.zshrc"
fi

echo ""
echo "-----------------------"
echo ""
echo "★ CLI shortcuts:"
echo "  -  Ctl+A Ctl+E: line begin/End"
echo "  -  Alt+B Alt+F: Back/Forward a word"
echo ""

echo "====================================================="
exit 0
