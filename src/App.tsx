  import { Amplify }  from 'aws-amplify';
  import '@aws-amplify/ui-react/styles.css';
  import { generateClient } from 'aws-amplify/api';
  import config from './amplifyconfiguration.json';
  import { withAuthenticator, View, Image, Heading } from '@aws-amplify/ui-react';
  import React, { useEffect, useReducer, useState } from 'react';
  import { Button, Col, Container, Form, Row, Table, Spinner } from 'react-bootstrap';
  import logo from './assets/images/Yelp-Logo.png';
  import './App.css';
  import { signOut } from 'aws-amplify/auth';
  import * as mutations from './graphql/mutations';
  import * as queries from './graphql/queries';
  import * as subscriptions from './graphql/subscriptions';
  import { OnCreateRestaurantSubscription } from './API';

 Amplify.configure(config);
 const client = generateClient();

  type Restaurant = {
    name: string;
    description: string;
    city: string;
  };

  type AppState = {
    restaurants: Restaurant[];
    formData: Restaurant;
  };

  type Action =
    | {
        type: 'QUERY';
        payload: Restaurant[];
      }
    | {
        type: 'SUBSCRIPTION';
        payload: Restaurant;
      }
    | {
        type: 'SET_FORM_DATA';
        payload: { [field: string]: string };
      };

  type SubscriptionEvent<D> = {
    value: {
      data: D;
    };
  };

  const initialState: AppState = {
    restaurants: [],
    formData: {
      name: '',
      city: '',
      description: '',
    },
  };
  const reducer = (state: AppState, action: Action) => {
    switch (action.type) {
      case 'QUERY':
        return { ...state, restaurants: action.payload };
      case 'SUBSCRIPTION':
        return { ...state, restaurants: [...state.restaurants, action.payload] };
      case 'SET_FORM_DATA':
        return { ...state, formData: { ...state.formData, ...action.payload } };
      default:
        return state;
    }
  };

  const App: React.FC = () => {

    const [loading, setLoading] = useState<boolean>(false);

    const createNewRestaurant = async (e: React.SyntheticEvent) => {
      e.stopPropagation();
      const { name, description, city } = state.formData;
      const restaurant = {
        name,
        description,
        city,
      };
      await client.graphql(
        {
          query: mutations.createRestaurant,
          variables: { input: restaurant }
        }
      );
      alert('New Restaurant added successfully');
      window.location.reload();

    };

    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
      getRestaurantList();

      const subscription = client.graphql({ query: subscriptions.onCreateRestaurant
       })
        .subscribe({
        next: ({ data }: { data: SubscriptionEvent<OnCreateRestaurantSubscription> }) => {
          console.log(data)
        },
      });

      return () => subscription.unsubscribe();
      
    }, []);

    const getRestaurantList = async () => {
      setLoading(true);
      const restaurants = await client.graphql({
        query: queries.listRestaurants
      });
      dispatch({
        type: 'QUERY',
        payload: restaurants.data.listRestaurants.items,
      });
      setLoading(false);
    };

    const handleChange = (e: any) =>
      dispatch({
        type: 'SET_FORM_DATA',
        payload: { [e.target.name]: e.target.value },
      });

    const handleSignOut = async () => {
        try {
          await signOut({ global: true });
        } catch (error) {
          console.log('error signing out: ', error);
        }
    };

    return (
      <div className="App">
        <Container>

        <Row className="my-3">
            <Col>
              <Button variant="danger" onClick={handleSignOut} className="float-right">
                Sign Out
              </Button>
            </Col>
          </Row>

          <Row className="mt-3">
            <Col md={4}>
              <Form>
                <Form.Group controlId="formDataName">
                  <Form.Control
                    onChange={handleChange}
                    type="text"
                    name="name"
                    placeholder="Name"
                  />
                </Form.Group>
                <Form.Group controlId="formDataDescription">
                  <Form.Control
                    onChange={handleChange}
                    type="text"
                    name="description"
                    placeholder="Description"
                  />
                </Form.Group>
                <Form.Group controlId="formDataCity">
                  <Form.Control
                    onChange={handleChange}
                    type="text"
                    name="city"
                    placeholder="City"
                  />
                </Form.Group>
                <Button onClick={createNewRestaurant} className="float-left">
                  Add New Restaurant
                </Button>
              </Form>
            </Col>
          </Row>

          <Row className="my-3">
          <Col>
            {loading ? (
              <div className="text-center">
                <Spinner animation="border" role="status">
                  <span className="sr-only">Loading...</span>
                </Spinner>
              </div>
            ) : state.restaurants.length ? (
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>City</th>
                  </tr>
                </thead>
                <tbody>
                  {state.restaurants.map((restaurant, index) => (
                    <tr key={`restaurant-${index}`}>
                      <td>{index + 1}</td>
                      <td>{restaurant.name}</td>
                      <td>{restaurant.description}</td>
                      <td>{restaurant.city}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : null}
          </Col>
        </Row>
        </Container>
      </div>
    );
  };


  export default withAuthenticator(App, {
    components: {
      Header() {
        return (
          <View textAlign="center" padding="large">
            <Image src={logo} className='login-logo' alt="Dropbox Logo" />
            <Heading level={3}>Welcome To My Yelp App</Heading>
          </View>
        );
      },
    },
  });

