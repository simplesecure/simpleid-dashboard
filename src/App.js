import React from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import "shards-ui/dist/css/shards.min.css"
import './App.css';
import { Doughnut } from 'react-chartjs-2';
import { Button, Card, CardBody, CardTitle, CardSubtitle, Modal, ModalFooter, Form, FormGroup, FormInput, ModalBody, ModalHeader, Container, Alert } from 'shards-react';
const URL = process.env.NODE_ENV === 'production' ? 'https://ancient-oasis-92375.herokuapp.com' : 'http://localhost:3000'
const axios = require('axios')
const PAYLOAD_DATA = 'data_payload'

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      signedIn: false, 
      payload: {}, 
      username: "", 
      password: "", 
      show: false,
      showUsersByApp: false,
      showNotification: false, 
      showProjectsWithEmails: false
    }
  }

  componentDidMount() {
    //Check if there's a payload in sessionStorage
    const payload = sessionStorage.getItem(PAYLOAD_DATA)
    if(payload) {
      this.setState({ payload: JSON.parse(payload), signedIn: true })
      this.fetchPayload()
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
    await this.setState({ showNotification: true })
    const payload = sessionStorage.getItem(PAYLOAD_DATA)
    let bearerToken = undefined
    if(payload) {
      const { bearer } = JSON.parse(payload)
      if(bearer) {
        bearerToken = bearer
      }
    }
    const config = {
      headers: { 'Content-Type': 'application/json' }
    }
    const body = {
      username, 
      password, 
      bearer: bearerToken 
    }
    
    try {
      const data = await axios.post(`${URL}/login`, JSON.stringify(body), config);

      sessionStorage.setItem(PAYLOAD_DATA, JSON.stringify(data.data))

      this.setState({ payload: data.data, signedIn: true, loading: false, showNotification: false })
    } catch(e) {
      this.setState({ error: "Trouble signing in or fetching data", loading: false, username: "", password: "", showNotification: false })
    }
  }

  renderLoading() {
    return (
      <div className="loading-page">
        Loading...
      </div>
    )
  }

  renderSignIn() {
    const { error } = this.state
    return (
      <div className='login'>

          <Card className='login-card'>
            <CardBody>
              <CardTitle>SimpleID Dashboard</CardTitle>
              <CardSubtitle className="mb-2 text-muted">Sign In</CardSubtitle>
              <Form onSubmit={this.handleSignIn}>
                <FormGroup controlId="formBasicEmail">
                  <label>Username</label>
                  <FormInput onChange={(e) => this.setState({ username: e.target.value })} type="text" placeholder="Enter username" />
                </FormGroup>

                <FormGroup controlId="formBasicPassword">
                  <label>Password</label>
                  <FormInput onChange={(e) => this.setState({ password: e.target.value })} type="password" placeholder="Password" />
                </FormGroup>
                <Button type="submit" variant="primary" >
                  Sign In
                </Button>
              </Form>
              <p className="error">{error}</p>
            </CardBody>
          </Card>

      </div>
    )
  }

  renderDashboard() {
    const { payload, show, showNotification, showUsersByApp, showProjectsWithEmails } = this.state
    const { data } = payload
    const { orgData, activeProjects, projectData, campaignCount, templateCount, notificationsCount, segmentsCount, emailsImported, emailsByProject } = data
    const { totalUsers, activeProjectData } = projectData
    const orgCount = typeof data.orgs === 'object' ? data.orgs.count : data.orgs
    const orgEmails = typeof data.orgs === 'object' ? data.orgs.orgs.map(a => {return a.email}) : []
    const projects = activeProjectData ? activeProjectData : []
    const projectLabels = projects.filter(p => Object.keys(p.analytics).length > 100).map(proj => {
      let appName
      for (const org of orgData) {
        const appKey = Object.keys(org.apps)                    
        if(appKey[0] === proj.app_id) {
          appName = org.apps[proj.app_id].project_name
        }
      }
      
      return appName
    })

    const projectChartData = projects.filter(p => Object.keys(p.analytics).length > 100).map(proj => {
      return Object.keys(proj.analytics).length
    })

    const projectChartColors = [];
    for(const chartData of projectChartData) {
      const color = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
      projectChartColors.push(color);
    }

    const usersByApp = {
      labels: projectLabels,
      datasets: [{
        data: projectChartData,
        backgroundColor: projectChartColors,
        hoverBackgroundColor: projectChartColors
      }]
    }
    return (
      <div>
        <div className="notification">
          <Alert className={showNotification ? "show-notification" : "hide-notification"} variant='info'>
            Fetching data...
          </Alert>
        </div>
        <div className="sign-out-btn">
          <Button onClick={this.handleSignOut} variant='primary'>Sign Out</Button>
        </div>
        <Container>
          <h1 className="heading text-center">SimpleID Dashboard</h1>
          <p style={{cursor: "pointer"}} onClick={this.fetchPayload}>Refresh Data</p>
          <div className='row'>            
            <div className='col col-lg-4 col-md-4 col-sm-6'>
              <div className="card-margin">
              <Card small={true}>
                <CardBody>
                  <CardTitle>Total Accounts</CardTitle>
                  <p>
                    <h3><button onClick={() => this.setState({ show: true})} className="a-button">{orgCount}</button></h3>
                  </p>
                </CardBody>
              </Card>
              </div>
            </div >
            <div className='col col-lg-4 col-md-4 col-sm-6'>
            <div className="card-margin">
              <Card small={true}>
                <CardBody>
                  <CardTitle>Total Projects Created</CardTitle>
                  <p>
                    <h3>{activeProjects ? activeProjects.length : 0}</h3>
                  </p>
                </CardBody>
              </Card>
              </div>
            </div>
            <div className='col col-lg-4 col-md-4 col-sm-6'>
            <div className="card-margin">
              <Card small={true}>
                <CardBody>
                  <CardTitle>Total End Users</CardTitle>
                  <p>
                    <h3><button onClick={() => this.setState({ showUsersByApp: true})} className="a-button">{totalUsers ? totalUsers.length : 0}</button></h3>
                  </p>
                </CardBody>
              </Card>
              </div>
            </div>
            <div className='col col-lg-4 col-md-4 col-sm-6'>
            <div className="card-margin">
              <Card small={true}>
                <CardBody>
                  <CardTitle>Segments Created</CardTitle>
                  <p>
                    <h3>{segmentsCount ? segmentsCount : 0}</h3>
                  </p>
                </CardBody>
              </Card>
              </div>
            </div>
            <div className='col col-lg-4 col-md-4 col-sm-6'>
            <div className="card-margin">
              <Card small={true}>
                <CardBody>
                  <CardTitle>Notifications Created</CardTitle>
                  <p>
                    <h3>{notificationsCount ? notificationsCount : 0}</h3>
                  </p>
                </CardBody>
              </Card>
              </div>
            </div>
            <div className='col col-lg-4 col-md-4 col-sm-6'>
            <div className="card-margin">
              <Card small={true}>
                <CardBody>
                  <CardTitle>Email Templates</CardTitle>
                  <p>
                    <h3>{templateCount ? templateCount : 0}</h3>
                  </p>
                </CardBody>
              </Card>
              </div>
            </div>
            <div className='col col-lg-4 col-md-4 col-sm-6'>
            <div className="card-margin">
              <Card small={true}>
                <CardBody>
                  <CardTitle>Emails Imported</CardTitle>
                  <p>
                    <h3>{emailsImported ? emailsImported : 0}</h3>
                  </p>
                </CardBody>
              </Card>
              </div>
            </div>
            <div className='col col-lg-4 col-md-4 col-sm-6'>
            <div className="card-margin">
              <Card small={true}>
                <CardBody>
                  <CardTitle>Projects With Emails</CardTitle>
                  <p>
                    <h3><button onClick={() => this.setState({ showProjectsWithEmails: true })} className='a-button'>{emailsByProject ? emailsByProject.length : 0}</button></h3>
                  </p>
                </CardBody>
              </Card>
              </div>
            </div>
            <div className='col col-lg-4 col-md-4 col-sm-6'>
            <div className="card-margin">
              <Card small={true}>
                <CardBody>
                  <CardTitle>Campaigns Sents</CardTitle>
                  <p>
                    <h3>{campaignCount ? campaignCount : 0}</h3>
                  </p>
                </CardBody>
              </Card>
              </div>
            </div>
            <div className='col col-sm-12'>
              <div className='chart'>
                <h3 className="text-center">Apps With More Than 100 Users</h3>
                <Doughnut width={400} data={usersByApp} />
              </div>
            </div>
          </div>

          <Modal open={show} toggle={() => this.setState({ show: false})}>
            <ModalHeader>
              Customers
            </ModalHeader>
            <ModalBody>
            <table className="table">
              <thead>
                <tr>
                  <th>Email</th>                  
                </tr>
              </thead>
              <tbody>
              {
                orgEmails.map(email => {
                  return (
                    <tr key={email}>
                      <td>{email}</td>
                    </tr>
                  )
                })
              }
              </tbody>
            </table>
            </ModalBody>
            <ModalFooter>
              <Button variant="primary" onClick={() => this.setState({ show: false})}>
                Done
              </Button>
            </ModalFooter>
          </Modal>


          <Modal open={showUsersByApp} toggle={() => this.setState({ showUsersByApp: false})}>
            <ModalHeader>
              Users by App
            </ModalHeader>
            <ModalBody>
            <table className='table'>
              <thead>
                <tr>
                  <th>App Name</th> 
                  <th>Total Users</th>                  
                </tr>
              </thead>
              <tbody>
              {
                
                projects.map(proj => {
                  let appName
                  for (const org of orgData) {
                    const appKey = Object.keys(org.apps)                    
                    if(appKey[0] === proj.app_id) {
                      appName = org.apps[proj.app_id].project_name
                    }
                  }
                  return (
                    <tr key={proj.app_id}>
                      <td>{appName}</td>
                      <td>{Object.keys(proj.analytics).length}</td>
                    </tr>
                  )
                })
              }
              </tbody>
            </table>
            </ModalBody>
            <ModalFooter>
              <Button variant="primary" onClick={() => this.setState({ showUsersByApp: false})}>
                Done
              </Button>
            </ModalFooter>
          </Modal>

          <Modal open={showProjectsWithEmails} toggle={() => this.setState({ showProjectsWithEmails: false})}>
            <ModalHeader>
              Emails Imported by Project
            </ModalHeader>
            <ModalBody>
            <table className='table'>
              <thead>
                <tr>
                  <th>App Name</th> 
                  <th>Emails Imported</th>                  
                </tr>
              </thead>
              <tbody>
              {
                
                emailsByProject.map(proj => {
                  
                  return (
                    <tr key={proj.appName}>
                      <td>{proj.appName}</td>
                      <td>{proj.emailsImported}</td>
                    </tr>
                  )
                })
              }
              </tbody>
            </table>
            </ModalBody>
            <ModalFooter>
              <Button variant="primary" onClick={() => this.setState({ showProjectsWithEmails: false})}>
                Done
              </Button>
            </ModalFooter>
          </Modal>

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
