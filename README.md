# ai-server
Nodejs server that streams  AI generated songs using Magenta

# Installation
This server is divided in two parts and you have to install them separately. 

**Important Note:** These steps are for macOS Mojave 10.4.2. For Linux or other versions of mac it will vary. 

## node/
In this folder, run 
```
$ npm install
```

### usage
To start up the server run
```
node app
```
or, in debug mode 
```
DEBUG=server node app
```

## python/
This part contains the [Google Magenta](https://magenta.tensorflow.org/) repo. To install it follow the steps below

### install Anaconda
   1. [Download](https://www.anaconda.com/distribution/) and follow installation instructions
   2. Make sure you have `$ conda` command available on your shell
   3. Create a python 3 environment  
   ```
   $ conda create -n magenta python=3.5
   ```
   4. In the root folder run `$ ./rebuild`. This will install most of packages dependencies you need. Alternatively, you can run `$ python setup.py install`
   5. Install fluydsynth `$ brew install fluisynth`
   5. Install pyFluidsynth _(Update this step)_
   
Then you're good to go. 

### usage
Go to magenta/models/perfomance_rnn/ folder and run
```
python ai_server.py
```


#### known issues
If you have problems with matplotlib. Consider the following
  1. Create or update this file ~/.matplotlib/matplotlibrc by adding this line into it
```backend: TkAgg```

___
