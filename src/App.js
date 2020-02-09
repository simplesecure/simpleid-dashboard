import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import Card from 'react-bootstrap/Card'
import Spinner from 'react-bootstrap/Spinner'
import Container from 'react-bootstrap/Container'
const URL = process.env.NODE_ENV === 'production' ? 'https://ancient-oasis-92375.herokuapp.com' : 'http://localhost:3000'
const rp = require('request-promise')
const PAYLOAD_DATA = 'data_payload'

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      signedIn: false, 
      payload: {}, 
      username: "", 
      password: ""
    }
  }

  componentDidMount() {
    //Check if there's a payload in sessionStorage
    const payload = sessionStorage.getItem(PAYLOAD_DATA)
    if(payload) {
      this.setState({ payload: JSON.parse(payload), signedIn: true })
    }
  }

  handleSignIn = (e) => {
    e.preventDefault()
    this.setState({ loading: true, error: "" })
    const { username, password } = this.state
    if(!username || !password) {
      this.setState({ error: "Please enter a valid username or password", loading: false })
    } else {
      this.fetchPayload(username, password)
    }
  }

  handleSignOut = () => {
    sessionStorage.clear()
    this.setState({ signedIn: false })
  }

  fetchPayload = async (username, password) => {
    const payload = sessionStorage.getItem(PAYLOAD_DATA)
    let bearerToken = undefined
    if(payload) {
      const { bearer } = JSON.parse(payload)
      if(bearer) {
        bearerToken = bearer
      }
    }
    const options = {
      method: 'POST',
      uri: `${URL}/login`,
      body: {
          username, 
          password, 
          bearer: bearerToken 
      },
      headers: { 'Content-Type': 'application/json' },
      json: true // Automatically stringifies the body to JSON
    };
    
    try {
      const data = await rp(options)
      sessionStorage.setItem(PAYLOAD_DATA, JSON.stringify(data))

      this.setState({ payload: data, signedIn: true, loading: false })
    } catch(e) {
      this.setState({ error: "Trouble signing in", loading: false, username: "", password: "" })
    }
  }

  renderLoading() {
    return (
      <div className="loading-page">
        <Spinner animation="grow" variant="info" />
      </div>
    )
  }

  renderSignIn() {
    const { error } = this.state
    return (
      <Row>
        <Col md={{ span: 6, offset: 3 }}>
          <Card className='login-card'>
            <Card.Body>
              <Card.Title>SimpleID Dashboard</Card.Title>
              <Card.Subtitle className="mb-2 text-muted">Sign In</Card.Subtitle>
              <Form onSubmit={this.handleSignIn}>
                <Form.Group controlId="formBasicEmail">
                  <Form.Label>Username</Form.Label>
                  <Form.Control onChange={(e) => this.setState({ username: e.target.value })} type="text" placeholder="Enter username" />
                </Form.Group>

                <Form.Group controlId="formBasicPassword">
                  <Form.Label>Password</Form.Label>
                  <Form.Control onChange={(e) => this.setState({ password: e.target.value })} type="password" placeholder="Password" />
                </Form.Group>
                <Button type="submit" variant="primary" >
                  Sign In
                </Button>
              </Form>
              <Card.Text className="error">{error}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    )
  }

  renderDashboard() {
    const { payload } = this.state
    const { data } = payload
    return (
      <div>
        <div className="sign-out-btn">
          <Button onClick={this.handleSignOut} variant='primary'>Sign Out</Button>
        </div>
        <Container>
          <h1 className="heading text-center">SimpleID Dashboard</h1>
          <Row>
            <Col xs={6} md={4} lg={3}>
              <Card>
                <Card.Body>
                  <Card.Title>Total Accounts</Card.Title>
                  <Card.Text>
                    <h3>{data.orgs}</h3>
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} lg={3}>
              <Card>
                <Card.Body>
                  <Card.Title>Total End Users</Card.Title>
                  <Card.Text>
                    <h3>{data.endUsers}</h3>
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} lg={3}>
              <Card>
                <Card.Body>
                  <Card.Title>Segments Created</Card.Title>
                  <Card.Text>
                    <h3>{data.segmentsCount}</h3>
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} lg={3}>
              <Card>
                <Card.Body>
                  <Card.Title>Notifications Created</Card.Title>
                  <Card.Text>
                    <h3>{data.notificationsCount}</h3>
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} lg={3}>
              <Card>
                <Card.Body>
                  <Card.Title>Email Templates</Card.Title>
                  <Card.Text>
                    <h3>{data.templateCount}</h3>
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} lg={3}>
              <Card>
                <Card.Body>
                  <Card.Title>Campaigns Sents</Card.Title>
                  <Card.Text>
                    <h3>{data.campaignCount}</h3>
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    )
  }

  render() {
    const { signedIn, loading } = this.state
    let elemContainer = undefined
    if(loading) {
      elemContainer = this.renderLoading()
    } else if(signedIn) {
      elemContainer = this.renderDashboard()
    } else {
      elemContainer = this.renderSignIn()
    }

    return (
      <div className="main">
        {elemContainer}
      </div>
    )
  }
}
