eval `ssh-agent -s`
ssh-add ~/.ssh/moonlight
git add -A
git commit -m $1
git push -u origin master
killall ssh-agent