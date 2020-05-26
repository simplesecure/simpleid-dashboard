import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "shards-ui/dist/css/shards.min.css";
import "./App.css";
// import { Doughnut } from "react-chartjs-2";
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  CardSubtitle,
  Modal,
  ModalFooter,
  Form,
  FormGroup,
  FormInput,
  ModalBody,
  ModalHeader,
  Container,
  Alert,
} from "shards-react";
const URL =
  process.env.NODE_ENV === "production"
    ? "https://dashboard.simpleid.xyz"
    : "http://localhost:3000";
const axios = require("axios");
const PAYLOAD_DATA = "data_payload";

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      signedIn: false,
      totalOrgs: 0,
      username: "",
      password: "",
      show: false,
      showUsersByApp: false,
      showNotification: false,
      showProjectsWithEmails: false,
      showSegmentsByApp: false,
      projects: [],
      totalEndUsers: 0,
      totalSegments: 0,
      totalNotifications: 0,
      totalTemplates: 0,
      totalCampaigns: 0,
      totalEmailsImported: 0,
      projectsWithEmails: [],
      orgList: []
    };

    this.segmentByAppTableData = []
  }

  componentDidMount() {
    //Check if there's a payload in sessionStorage
    const payload = sessionStorage.getItem(PAYLOAD_DATA);
    if (payload) {
      this.setState({ signedIn: true });
    }
    this.fetchPayload();
  }

  handleSignIn = (e) => {
    e.preventDefault();
    this.setState({ loading: true, error: "" });
    const { username, password } = this.state;
    if (!username || !password) {
      this.setState({
        error: "Please enter a valid username or password",
        loading: false,
      });
    } else {
      this.fetchPayload(username, password);
    }
  };

  handleSignOut = () => {
    sessionStorage.clear();
    this.setState({ signedIn: false });
  };

  fetchPayload = async (username, password) => {
    await this.setState({ showNotification: true });
    const payload = sessionStorage.getItem(PAYLOAD_DATA);
    let token;
    if (payload) {
      const { bearer } = JSON.parse(payload);
      token = bearer;
    }
    const config = {
      headers: { "Content-Type": "application/json" },
    };
    const body = {
      username,
      password,
      bearer: token,
    };

    try {
      const res = await axios.post(
        `${URL}/login`,
        JSON.stringify(body),
        config
      );
      const { bearer, data } = res.data;
      const payload = {
        bearer,
      };

      sessionStorage.setItem(PAYLOAD_DATA, JSON.stringify(payload));
      const { users, projects } = data;

      const totalEndUsers = projects
        .map((proj) => {return proj && proj.totalUsers ? proj.totalUsers : 0}).reduce((a, b) => a + b, 0)

      const totalSegments = projects.map(proj => { return proj && proj.segments ? proj.segments.length : 0}).reduce((a, b) => a + b, 0)

      const totalNotifications = projects.map(proj => { return proj && proj.notifications ? proj.notifications.length : 0}).reduce((a, b) => a + b, 0)

      const totalTemplates = projects.map(proj => { return proj && proj.templates ? proj.templates.length : 0}).reduce((a, b) => a + b, 0)

      const totalEmailsImported = projects.map(proj => { return proj && proj.emailsImported }).reduce((a, b) => a + b, 0)

      const totalCampaigns = projects.map(proj => { return proj && proj.campaigns ? proj.campaigns.length : 0}).reduce((a, b) => a + b, 0)

      const projectsWithEmails = projects.filter(proj => proj.emailsImported);


      // Segments by App is Table Data structured as follows (sorted most to least segments):
      //  [
      //    {
      //      subHeading: {
      //        appName: <app name>,
      //        orgContact: <org contact>,
      //        totalUsers: <total users>,
      //        numSegments: <number of segments>
      //      },
      //      segments: [
      //        {
      //          segmentName: <segment Name>,
      //          userCount: <user count>
      //        }
      //      ]
      //    }, ...
      // ]
      //
      //
      // Build a lookup of org contact to org id:
      //
      const orgContactLookup = {}
      for (const user of users.orgs) {
        orgContactLookup[user.sid.org_id] = user.email
      }
      //
      // Sort the apps / projects by number of segments:
      //
      projects.sort((a, b) => {
        return b.segments.length - a.segments.length
      })
      //
      // Build the Table Data
      //
      this.segmentByAppTableData = []
      for (const app of projects) {
        const segmentTableData = {
          subHeading: {
            appName: app.name,
            orgContact: orgContactLookup[app.org_id],
            totalUsers: app.totalUsers,
            numSegments: app.segments.length
          },
          segments: []
        }
        for (const segment of app.segments) {
          segmentTableData.segments.push({
            segmentName: segment.name,
            userCount: segment.userCount
          })
        }
        segmentTableData.segments.sort((a, b) => {
          return b.userCount - a.userCount
        })
        this.segmentByAppTableData.push(segmentTableData)
      }


      this.setState({
        totalOrgs: users.count ? users.count : 0,
        totalEndUsers,
        totalSegments,
        totalNotifications,
        totalTemplates,
        totalEmailsImported,
        projectsWithEmails,
        totalCampaigns,
        orgList: users.orgs ? users.orgs : [],
        signedIn: true,
        loading: false,
        projects,
        showNotification: false,
      });
    } catch (e) {
      console.log(e);
      this.setState({
        error: "Trouble signing in or fetching data",
        loading: false,
        username: "",
        password: "",
        showNotification: false,
      });
    }
  };

  getSegmentsByApplicationTable() {
    const tableData = []
    let key = 0
    for (const appSegmentData of this.segmentByAppTableData) {
      tableData.push(
        <tr key={key++}>
          <td>{appSegmentData.subHeading.appName}</td>
          <td>{appSegmentData.subHeading.orgContact}</td>
          <td>{appSegmentData.subHeading.totalUsers}</td>
          <td>{appSegmentData.subHeading.numSegments}</td>
          <td></td>
          <td></td>
        </tr>
      )

      for (const segmentData of appSegmentData.segments) {
        tableData.push(
          <tr key={key++}>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td>{segmentData.segmentName}</td>
            <td>{segmentData.userCount}</td>
          </tr>
        )
      }
    }

    return (
      <table className="table">
        <thead>
          <tr key={key++}>
            <th>App Name</th>
            <th>Org Contact</th>
            <th># Users</th>
            <th># Segments</th>
            <th>Segment Name</th>
            <th>User Count</th>
          </tr>
        </thead>
        <tbody>
          {tableData}
        </tbody>
      </table>
    )
  }

  renderLoading() {
    return <div className="loading-page">Loading...</div>;
  }

  renderSignIn() {
    const { error } = this.state;
    return (
      <div className="login">
        <Card className="login-card">
          <CardBody>
            <CardTitle>SimpleID Dashboard</CardTitle>
            <CardSubtitle className="mb-2 text-muted">Sign In</CardSubtitle>
            <Form onSubmit={this.handleSignIn}>
              <FormGroup>
                <label>Username</label>
                <FormInput
                  onChange={(e) => this.setState({ username: e.target.value })}
                  type="text"
                  placeholder="Enter username"
                />
              </FormGroup>

              <FormGroup>
                <label>Password</label>
                <FormInput
                  onChange={(e) => this.setState({ password: e.target.value })}
                  type="password"
                  placeholder="Password"
                />
              </FormGroup>
              <Button type="submit" variant="primary">
                Sign In
              </Button>
            </Form>
            <p className="error">{error}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  renderDashboard() {
    const {
      projects,
      show,
      showNotification,
      showUsersByApp,
      showProjectsWithEmails,
      showSegmentsByApp,
      totalEndUsers,
      totalSegments,
      totalNotifications,
      totalTemplates,
      totalEmailsImported,
      projectsWithEmails,
      totalCampaigns,
      orgList,
      totalOrgs
    } = this.state;
    // const orgEmails =
    //   typeof data.orgs === "object"
    //     ? data.orgs.orgs.map((a) => {
    //         return a.email;
    //       })
    //     : [];

    // const projectLabels = projects
    //   .filter((p) => Object.keys(p.analytics).length > 100)
    //   .map((proj) => {
    //     let appName;
    //     for (const org of orgData) {
    //       const appKey = Object.keys(org.apps);
    //       if (appKey[0] === proj.app_id) {
    //         appName = org.apps[proj.app_id].project_name;
    //       }
    //     }

    //     return appName;
    //   });

    // const projectChartData = projects
    //   .filter((p) => Object.keys(p.analytics).length > 100)
    //   .map((proj) => {
    //     return Object.keys(proj.analytics).length;
    //   });

    // const projectChartColors = [];
    // for (const chartData of projectChartData) {
    //   const color = "#" + ((Math.random() * 0xffffff) << 0).toString(16);
    //   projectChartColors.push(color);
    // }

    // const usersByApp = {
    //   labels: projectLabels,
    //   datasets: [
    //     {
    //       data: projectChartData,
    //       backgroundColor: projectChartColors,
    //       hoverBackgroundColor: projectChartColors,
    //     },
    //   ],
    // };
    return (
      <div>
        <div className="notification">
          <Alert
            className={
              showNotification ? "show-notification" : "hide-notification"
            }
            variant="info"
          >
            Fetching data...
          </Alert>
        </div>
        <div className="sign-out-btn">
          <Button onClick={this.handleSignOut} variant="primary">
            Sign Out
          </Button>
        </div>
        <Container>
          <h1 className="heading text-center">SimpleID Dashboard</h1>
          <p style={{ cursor: "pointer" }} onClick={this.fetchPayload}>
            Refresh Data
          </p>
          <div className="row">
            <div className="col col-lg-4 col-md-4 col-sm-6">
              <div className="card-margin">
                <Card small={true}>
                  <CardBody>
                    <CardTitle>Total Accounts</CardTitle>
                      <h3>
                        <button
                          onClick={() => this.setState({ show: true })}
                          className="a-button"
                        >
                          {totalOrgs}
                        </button>
                      </h3>
                  </CardBody>
                </Card>
              </div>
            </div>
            <div className="col col-lg-4 col-md-4 col-sm-6">
              <div className="card-margin">
                <Card small={true}>
                  <CardBody>
                    <CardTitle>Total Projects Created</CardTitle>
                      <h3>{projects ? projects.length : 0}</h3>
                  </CardBody>
                </Card>
              </div>
            </div>
            <div className="col col-lg-4 col-md-4 col-sm-6">
              <div className="card-margin">
                <Card small={true}>
                  <CardBody>
                    <CardTitle>Total End Users</CardTitle>
                      <h3>
                        <button
                          onClick={() =>
                            this.setState({ showUsersByApp: true })
                          }
                          className="a-button"
                        >
                          {totalEndUsers}
                        </button>
                      </h3>
                  </CardBody>
                </Card>
              </div>
            </div>
            <div className="col col-lg-4 col-md-4 col-sm-6">
              <div className="card-margin">
                <Card small={true}>
                  <CardBody>
                    <CardTitle>Segments Created</CardTitle>
                      <h3>
                        <button
                          onClick={() => this.setState({ showSegmentsByApp: true })}
                          className="a-button">
                          {totalSegments}
                        </button>
                      </h3>
                  </CardBody>
                </Card>
              </div>
            </div>
            <div className="col col-lg-4 col-md-4 col-sm-6">
              <div className="card-margin">
                <Card small={true}>
                  <CardBody>
                    <CardTitle>Notifications Created</CardTitle>
                      <h3>{totalNotifications}</h3>
                  </CardBody>
                </Card>
              </div>
            </div>
            <div className="col col-lg-4 col-md-4 col-sm-6">
              <div className="card-margin">
                <Card small={true}>
                  <CardBody>
                    <CardTitle>Email Templates</CardTitle>
                      <h3>{totalTemplates}</h3>
                  </CardBody>
                </Card>
              </div>
            </div>
            <div className="col col-lg-4 col-md-4 col-sm-6">
              <div className="card-margin">
                <Card small={true}>
                  <CardBody>
                    <CardTitle>Emails Imported</CardTitle>
                      <h3>{totalEmailsImported}</h3>
                  </CardBody>
                </Card>
              </div>
            </div>
            <div className="col col-lg-4 col-md-4 col-sm-6">
              <div className="card-margin">
                <Card small={true}>
                  <CardBody>
                    <CardTitle>Projects With Emails</CardTitle>
                      <h3>
                        <button
                          onClick={() =>
                            this.setState({ showProjectsWithEmails: true })
                          }
                          className="a-button"
                        >
                          {projectsWithEmails.length}
                        </button>
                      </h3>
                  </CardBody>
                </Card>
              </div>
            </div>
            <div className="col col-lg-4 col-md-4 col-sm-6">
              <div className="card-margin">
                <Card small={true}>
                  <CardBody>
                    <CardTitle>Campaigns Sents</CardTitle>
                      <h3>{totalCampaigns}</h3>
                  </CardBody>
                </Card>
              </div>
            </div>
            {/* <div className="col col-sm-12">
              <div className="chart">
                <h3 className="text-center">Apps With More Than 100 Users</h3>
                <Doughnut width={400} data={usersByApp} />
              </div>
            </div> */}
          </div>

          <Modal open={show} toggle={() => this.setState({ show: false })}>
            <ModalHeader>Customers</ModalHeader>
            <ModalBody>
              <table className="table">
                <thead>
                  <tr>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {orgList.map((org) => {
                    return (
                      <tr key={org.email}>
                        <td>{org.email}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="primary"
                onClick={() => this.setState({ show: false })}
              >
                Done
              </Button>
            </ModalFooter>
          </Modal>

          <Modal
            open={showUsersByApp}
            toggle={() => this.setState({ showUsersByApp: false })}
          >
            <ModalHeader>Users by App</ModalHeader>
            <ModalBody>
              <table className="table">
                <thead>
                  <tr>
                    <th>App Name</th>
                    <th>Total Users</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((proj) => {
                    return (
                      <tr key={proj.project_id}>
                        <td>{proj.name}</td>
                        <td>{proj.totalUsers}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="primary"
                onClick={() => this.setState({ showUsersByApp: false })}
              >
                Done
              </Button>
            </ModalFooter>
          </Modal>

          <Modal
            open={showProjectsWithEmails}
            toggle={() => this.setState({ showProjectsWithEmails: false })}
          >
            <ModalHeader>Emails Imported by Project</ModalHeader>
            <ModalBody>
              <table className="table">
                <thead>
                  <tr>
                    <th>App Name</th>
                    <th>Emails Imported</th>
                  </tr>
                </thead>
                <tbody>
                  {projectsWithEmails.map((proj) => {
                    return (
                      <tr key={proj.project_id}>
                        <td>{proj.name}</td>
                        <td>{proj.emailsImported}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="primary"
                onClick={() => this.setState({ showProjectsWithEmails: false })}
              >
                Done
              </Button>
            </ModalFooter>
          </Modal>

          <Modal
            size='xl'
            open={showSegmentsByApp}
            toggle={() => this.setState({ showSegmentsByApp: false })}>
            <ModalHeader>Segments By Application</ModalHeader>
            <ModalBody>
              {this.getSegmentsByApplicationTable()}
            </ModalBody>
            <ModalFooter>
              <Button
                variant="primary"
                onClick={() => this.setState({ showSegmentsByApp: false })}>
                Done
              </Button>
            </ModalFooter>
          </Modal>
        </Container>
      </div>
    );
  }

  render() {
    const { signedIn, loading } = this.state;
    let elemContainer = undefined;
    if (loading) {
      elemContainer = this.renderLoading();
    } else if (signedIn) {
      elemContainer = this.renderDashboard();
    } else {
      elemContainer = this.renderSignIn();
    }

    return <div className="main">{elemContainer}</div>;
  }
}
