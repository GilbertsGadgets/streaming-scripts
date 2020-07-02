# streaming-scripts
These scripts control my bots (physical and virtual) and the other interaction on my Twitch stream.
These scripts serve as a central server which communicates with a number of Twitch APIs, interprets events that are important to my stream, and then sends commands to external bots to control those bots remotely.
This project is not intended to be used as-is, but is provided as a resource for others who wish to mimic the functionality of my bots for their own purposes.
For these scripts to work, you will need access to PubSub and tmi.js interfaces by generating oauth tokens. These are stored in .json files in the ouath directory. Dummy values have been inserted to help developers know where to put these tokens and what information is needed for the bots to work. I hope to add information on how to create/find this information soon. In the meantime, if you need help generating these tokens and getting this information, reach out to me.
