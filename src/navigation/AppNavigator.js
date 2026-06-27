import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import {
  NavigationContainer, DefaultTheme, DarkTheme,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationsContext';
import { tabBarAnim } from '../utils/tabBarAnim';

import OnboardingScreen from '../screens/OnboardingScreen';
import RateSellerScreen from '../screens/RateSellerScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MyItemsScreen from '../screens/MyItemsScreen';
import AddItemScreen from '../screens/AddItemScreen';
import MyOrdersScreen from '../screens/MyOrdersScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import PaymentScreen from '../screens/PaymentScreen';
import AddressScreen from '../screens/AddressScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RateProductScreen from '../screens/RateProductScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsScreen from '../screens/TermsScreen';
import OffersScreen from '../screens/OffersScreen';
import SellerProfileScreen from '../screens/SellerProfileScreen';
import StoreProfileScreen from '../screens/StoreProfileScreen';
import VerificationScreen from '../screens/VerificationScreen';
import EditStoreScreen from '../screens/EditStoreScreen';
import TradeInFormScreen from '../screens/TradeInFormScreen';
import TradeInCheckoutScreen from '../screens/TradeInCheckoutScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const NO_HEADER = { headerShown: false };
const MODAL = { headerShown: false, presentation: 'modal', gestureEnabled: true };

// Global navigation ref — allows navigating from anywhere (including outside NavigationContainer)
export const navigationRef = createNavigationContainerRef();

const TAB_NAMES = ['Home', 'Search', 'Favorites', 'Cart', 'Profile'];
const TAB_ROOT_SCREENS = new Set(['HomeMain', 'SearchMain', 'FavoritesMain', 'CartMain', 'ProfileMain']);

function getLeafRoute(state) {
  if (!state?.routes?.length) return null;
  const route = state.routes[state.index ?? 0];
  if (route.state) return getLeafRoute(route.state);
  return route.name;
}

const TAB_ICONS = {
  Home:      ['home', 'home-outline'],
  Search:    ['search', 'search-outline'],
  Favorites: ['heart', 'heart-outline'],
  Cart:      ['bag', 'bag-outline'],
  Profile:   ['person', 'person-outline'],
};

const pillScale = tabBarAnim.interpolate({
  inputRange: [0, 1],
  outputRange: [0.82, 1],
  extrapolate: 'clamp',
});

// Recursively find which tab is active from the nav state tree
function getActiveTab(state) {
  if (!state?.routes?.length) return 'Home';
  const route = state.routes[state.index ?? 0];
  if (!route) return 'Home';
  if (TAB_NAMES.includes(route.name)) return route.name;
  if (route.state) return getActiveTab(route.state);
  return 'Home';
}

// Global tab bar — renders OUTSIDE NavigationContainer so it shows on ALL screens
function GlobalTabBar({ activeTab }) {
  const { itemCount } = useCart();
  const { totalUnread } = useChat();
  const { unreadCount } = useNotifications();
  const insets = useSafeAreaInsets();
  const unread = totalUnread();
  const profileBadge = unread + unreadCount;

  const badges = {
    Cart: itemCount > 0 ? (itemCount > 9 ? '9+' : String(itemCount)) : null,
    Profile: profileBadge > 0 ? (profileBadge > 9 ? '9+' : String(profileBadge)) : null,
  };

  function handlePress(name) {
    if (navigationRef.isReady()) {
      navigationRef.navigate(name);
    }
  }

  return (
    <View style={[tabStyles.wrapper, { paddingBottom: insets.bottom + 10 }]}>
      <Animated.View style={[tabStyles.pillOuter, { transform: [{ scale: pillScale }] }]}>
        <BlurView intensity={100} tint="systemThinMaterialDark" style={tabStyles.blur}>
          <View style={tabStyles.glassOverlay}>
            {TAB_NAMES.map(name => {
              const focused = activeTab === name;
              const [iconOn, iconOff] = TAB_ICONS[name];
              const badge = badges[name];

              return (
                <TouchableOpacity
                  key={name}
                  style={[tabStyles.tabBtn, focused && tabStyles.tabBtnActive]}
                  onPress={() => handlePress(name)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={focused ? iconOn : iconOff}
                    size={24}
                    color={focused ? '#fff' : 'rgba(255,255,255,0.48)'}
                  />
                  {badge && (
                    <View style={tabStyles.badge}>
                      <Text style={tabStyles.badgeText}>{badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </Animated.View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  pillOuter: {
    borderRadius: 38,
    overflow: 'hidden',
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.14)',
    shadowColor: '#000',
    shadowOpacity: 0.38,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 20,
  },
  blur: {},
  glassOverlay: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 9,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 26,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  badge: {
    position: 'absolute',
    top: 3,
    right: '18%',
    backgroundColor: '#ff4757',
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});

// ─── Stack Navigators ────────────────────────────────────────────────────────

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={NO_HEADER}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={NO_HEADER}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Offers" component={OffersScreen} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="SellerProfile" component={StoreProfileScreen} />
      <Stack.Screen name="EditStore" options={MODAL} component={EditStoreScreen} />
      <Stack.Screen name="Chat" options={MODAL} component={ChatScreen} />
      <Stack.Screen name="RateSeller" options={MODAL} component={RateSellerScreen} />
      <Stack.Screen name="RateProduct" options={MODAL} component={RateProductScreen} />
      <Stack.Screen name="TradeInForm" options={MODAL} component={TradeInFormScreen} />
      <Stack.Screen name="TradeInCheckout" options={MODAL} component={TradeInCheckoutScreen} />
    </Stack.Navigator>
  );
}

function SearchStack() {
  return (
    <Stack.Navigator screenOptions={NO_HEADER}>
      <Stack.Screen name="SearchMain" component={SearchScreen} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="SellerProfile" component={StoreProfileScreen} />
      <Stack.Screen name="EditStore" options={MODAL} component={EditStoreScreen} />
      <Stack.Screen name="Chat" options={MODAL} component={ChatScreen} />
      <Stack.Screen name="RateSeller" options={MODAL} component={RateSellerScreen} />
      <Stack.Screen name="RateProduct" options={MODAL} component={RateProductScreen} />
      <Stack.Screen name="TradeInForm" options={MODAL} component={TradeInFormScreen} />
      <Stack.Screen name="TradeInCheckout" options={MODAL} component={TradeInCheckoutScreen} />
    </Stack.Navigator>
  );
}

function FavoritesStack() {
  return (
    <Stack.Navigator screenOptions={NO_HEADER}>
      <Stack.Screen name="FavoritesMain" component={FavoritesScreen} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="SellerProfile" component={StoreProfileScreen} />
      <Stack.Screen name="EditStore" options={MODAL} component={EditStoreScreen} />
      <Stack.Screen name="Chat" options={MODAL} component={ChatScreen} />
      <Stack.Screen name="RateSeller" options={MODAL} component={RateSellerScreen} />
      <Stack.Screen name="RateProduct" options={MODAL} component={RateProductScreen} />
      <Stack.Screen name="TradeInForm" options={MODAL} component={TradeInFormScreen} />
      <Stack.Screen name="TradeInCheckout" options={MODAL} component={TradeInCheckoutScreen} />
    </Stack.Navigator>
  );
}

function CartStack() {
  return (
    <Stack.Navigator screenOptions={NO_HEADER}>
      <Stack.Screen name="CartMain" component={CartScreen} />
      <Stack.Screen name="Payment" options={MODAL} component={PaymentScreen} />
      <Stack.Screen name="Addresses" options={MODAL} component={AddressScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={NO_HEADER}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="MyItems" component={MyItemsScreen} />
      <Stack.Screen name="AddItem" options={MODAL} component={AddItemScreen} />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="EditProfile" options={MODAL} component={EditProfileScreen} />
      <Stack.Screen name="ResetPassword" options={MODAL} component={ResetPasswordScreen} />
      <Stack.Screen name="Settings" options={MODAL} component={SettingsScreen} />
      <Stack.Screen name="Addresses" options={MODAL} component={AddressScreen} />
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="Chat" options={MODAL} component={ChatScreen} />
      <Stack.Screen name="HelpCenter" options={MODAL} component={HelpCenterScreen} />
      <Stack.Screen name="PrivacyPolicy" options={MODAL} component={PrivacyPolicyScreen} />
      <Stack.Screen name="Terms" options={MODAL} component={TermsScreen} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="SellerProfile" component={StoreProfileScreen} />
      <Stack.Screen name="RateProduct" options={MODAL} component={RateProductScreen} />
      <Stack.Screen name="RateSeller" options={MODAL} component={RateSellerScreen} />
      <Stack.Screen name="Verification" options={MODAL} component={VerificationScreen} />
      <Stack.Screen name="EditStore" options={MODAL} component={EditStoreScreen} />
    </Stack.Navigator>
  );
}

// Tab.Navigator with hidden built-in bar (replaced by GlobalTabBar)
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={() => null}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"      component={HomeStack} />
      <Tab.Screen name="Search"    component={SearchStack} />
      <Tab.Screen name="Favorites" component={FavoritesStack} />
      <Tab.Screen name="Cart"      component={CartStack} />
      <Tab.Screen name="Profile"   component={ProfileStack} />
    </Tab.Navigator>
  );
}

// ─── Root Navigator ──────────────────────────────────────────────────────────

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('Home');
  const [showTabBar, setShowTabBar] = useState(true);
  const [splashReady, setSplashReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSplashReady(true), 1000);
    return () => clearTimeout(t);
  }, []);

  function onStateChange(state) {
    const tab = getActiveTab(state);
    if (tab !== activeTab) setActiveTab(tab);
    const leaf = getLeafRoute(state);
    setShowTabBar(!leaf || TAB_ROOT_SCREENS.has(leaf));
  }

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: colors.bg,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  if (loading || !splashReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F2' }}>
        <Text style={{ fontSize: 46, color: '#111111', letterSpacing: -1, includeFontPadding: false }}>
          <Text style={{ fontWeight: '300' }}>Eletro</Text>
          <Text style={{ fontWeight: '900' }}>Hub</Text>
        </Text>
        <Text style={{ fontSize: 11, color: '#AAAAAA', fontWeight: '400', letterSpacing: 3, marginTop: 12 }}>
          MARKETPLACE DE ELETRÔNICOS
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer theme={navTheme} ref={navigationRef} onStateChange={onStateChange}>
        {user ? <MainTabs /> : <AuthStack />}
      </NavigationContainer>
      {user && showTabBar && <GlobalTabBar activeTab={activeTab} />}
    </View>
  );
}
