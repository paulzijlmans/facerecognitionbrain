import React, { Component } from 'react';
import Particles from "react-tsparticles";
import Navigation from './components/Navigation/Navigation';
import Signin from './components/Signin/Signin';
import Register from './components/Register/Register';
import Logo from './components/Logo/Logo';
import Rank from './components/Rank/Rank';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import FaceRecognition from './components/FaceRecognition/FaceRecognition';
import { particlesOptions } from './particlesOptions';
import Modal from './components/Modal/Modal';

import './App.css';
import Profile from './components/Profile/Profile';

const initialState = {
  input: '',
  imageUrl: '',
  boxes: [],
  route: 'signin',
  isSignedIn: false,
  isProfileOpen: false,
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: '',
    pet: '',
    age: ''
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = initialState;
  }

  componentDidMount() {
    const token = window.sessionStorage.getItem('token');
    if (token) {
      fetch(`${process.env.REACT_APP_SERVER}/signin`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        }
      })
        .then(resp => resp.json())
        .then(data => {
          if (data && data.id) {
            fetch(`${process.env.REACT_APP_SERVER}/profile/${data.id}`, {
              method: 'get',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token
              }
            })
              .then(resp => resp.json())
              .then(user => {
                if (user && user.email) {
                  this.loadUser(user);
                  this.onRouteChange('home');
                }
              })
          }
        })
        .catch(console.log);
    }
  }

  loadUser = (data) => {
    this.setState({
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        entries: data.entries,
        joined: data.joined,
        age: data.age,
        pet: data.pet
      }
    });
  }

  calculateFaceLocations = (data) => {
    if (data && data.outputs) {
      return data.outputs[0].data.regions.map(face => {
        const clarifaiFace = face.region_info.bounding_box;
        const image = document.getElementById('inputImage');
        const width = Number(image.width);
        const height = Number(image.height);
        return {
          leftCol: clarifaiFace.left_col * width,
          topRow: clarifaiFace.top_row * height,
          rightCol: width - (clarifaiFace.right_col * width),
          bottomRow: height - (clarifaiFace.bottom_row * height)
        }
      });
    }
  }

  displayFaceBoxes = (boxes) => {
    if (boxes) {
      this.setState({ boxes: boxes });
    }
  }

  onInputChange = (event) => {
    this.setState({ input: event.target.value });
  }

  onButtonSubmit = () => {
    this.setState({ imageUrl: this.state.input });
    fetch(`${process.env.REACT_APP_SERVER}/imageUrl`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': window.sessionStorage.getItem('token')
      },
      body: JSON.stringify({
        input: this.state.input
      })
    })
      .then(response => response.json())
      .then(response => {
        if (response) {
          fetch(`${process.env.REACT_APP_SERVER}/image`, {
            method: 'put',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': window.sessionStorage.getItem('token')
            },
            body: JSON.stringify({
              id: this.state.user.id
            })
          }).then(res => res.json())
            .then(count => {
              this.setState(Object.assign(this.state.user, { entries: count }));
            })
            .catch(console.log);
        }
        this.displayFaceBoxes(this.calculateFaceLocations(response));
      })
      .catch(err => console.log(err));
  }

  onRouteChange = (route) => {
    if (route === 'signout') {
      return this.setState(initialState);
    } else if (route === 'home') {
      this.setState({ isSignedIn: true });
    }
    this.setState({ route: route });
  }

  toggleModal = () => {
    this.setState(prevState => ({
      ...prevState,
      isProfileOpen: !prevState.isProfileOpen
    }));
  }

  render() {
    const { isSignedIn, imageUrl, route, boxes, isProfileOpen, user } = this.state;
    return (
      <div className="App">
        <Particles className='particles'
          options={particlesOptions}
        />
        <Navigation
          isSignedIn={isSignedIn}
          onRouteChange={this.onRouteChange}
          toggleModal={this.toggleModal} />
        {isProfileOpen && <Modal>
          <Profile
            isProfileOpen={isProfileOpen}
            toggleModal={this.toggleModal}
            loadUser={this.loadUser}
            user={user} />
        </Modal>}
        {route === 'home'
          ? <div>
            <Logo />
            <Rank name={this.state.user.name} entries={this.state.user.entries} />
            <ImageLinkForm
              onInputChange={this.onInputChange}
              onButtonSubmit={this.onButtonSubmit}
            />
            <FaceRecognition boxes={boxes} imageUrl={imageUrl} />
          </div>
          : this.displaySigninOrRegister(route)
        }
      </div>
    );
  }

  displaySigninOrRegister(route) {
    if (route === 'signin') {
      return <Signin loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
    } else {
      return <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
    }
  }
}

export default App;
