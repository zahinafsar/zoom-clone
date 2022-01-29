import React, {useEffect, useState} from 'react';
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  Linking,
  RefreshControl,
} from 'react-native';
import {Button, ButtonProps, Icon, Text} from '@ui-kitten/components';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Divider from '../components/custom/Divider';
import Ripple from 'react-native-material-ripple';
import moment from 'moment';
import {SwipeListView} from 'react-native-swipe-list-view';
const Service = (props: any) => (
  <Icon {...props} fill="black" name="shopping-bag-outline" />
);

const ServiceHistory = ({service, status, time}: any) => (
  <Button
    accessoryLeft={props => (
      <View style={{flexDirection: 'row'}}>
        <Service {...props} />
        <Text>{service}</Text>
      </View>
    )}
    accessoryRight={() => (
      <View style={{alignItems: 'center', flexDirection: 'row'}}>
        <Text style={{opacity: 0.5, marginRight: 10, fontSize: 10}}>
          {moment(time?.toDate()).fromNow()}
        </Text>
        <Button
          status={status === 'canceled' ? 'danger' : 'info'}
          appearance="outline"
          size="tiny">
          {status}
        </Button>
      </View>
    )}
    appearance="outline"
    style={{
      marginVertical: 5,
      justifyContent: 'space-between',
      backgroundColor: 'white',
      elevation: 3,
    }}
    status="control"
  />
);

function History({navigation}) {
  const [loader, setLoader] = useState(false);
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const savenDays = firestore.Timestamp.fromDate(
      new Date(moment().subtract(7, 'days').format()),
    );
    const id = await AsyncStorage.getItem('uid');
    const orderDB = await firestore().collection('orders');
    orderDB
      .where('userId', '==', id)
      .where('createdAt', '>=', savenDays)
      .orderBy('createdAt', 'desc')
      .get()
      .then(querySnapshot => {
        const data = querySnapshot.docs.map(doc => {
          return {...doc.data(), id: doc.id};
        });
        setOrders(data);
      });
    const plansDB = await firestore().collection('plans');
    plansDB
      .where('userId', '==', id)
      .where('status', '==', 'pending')
      .get()
      .then(querySnapshot => {
        const data = querySnapshot.docs.map(doc => {
          return {...doc.data(), id: doc.id};
        });
        if (data.length) {
          setOrders(prev => {
            return [{...data[0], type: 'plan'}, ...prev];
          });
        }
      });
  };
  const cencelOrder = async data => {
    setLoader(true);
    const order = await firestore()
      .collection(data.type === 'plan' ? 'plans' : 'orders')
      .doc(data.id);
    await order.update({status: 'canceled'});
    setLoader(false);
    fetchData();
  };

  return (
    <>
      <View style={{padding: 5, flex: 1}}>
        <View
          style={{
            height: 30,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Text category="c1" style={{opacity: 0.5}}>
            Swipe left to cencel order
          </Text>
          <Icon
            fill="red"
            name="close-circle-outline"
            style={{width: 17, height: 17, marginLeft: 5}}
          />
        </View>
        <SwipeListView
          refreshControl={
            <RefreshControl refreshing={loader} onRefresh={fetchData} />
          }
          data={orders}
          renderItem={data => (
            <ServiceHistory
              key={data.index}
              service={data.item.related_service}
              time={data.item.createdAt}
              status={data.item.status}
            />
          )}
          renderHiddenItem={data =>
            data.item.status === 'pending' ? (
              <View
                style={{
                  flex: 1,
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                }}>
                <Button
                  onPress={() => cencelOrder(data.item)}
                  style={{marginRight: 10}}
                  status="danger"
                  size="tiny">
                  Cancel
                </Button>
              </View>
            ) : null
          }
          rightOpenValue={-85}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({});

export default History;
