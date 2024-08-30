import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, sizes, spacing } from './theme';
import Carousel from './Cast/Carousel';
import ArticleCarousel from './Cast/ArticleCarousel';
import { RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const CastScreen = () => {
  const navigation = useNavigation();
  const [SuggestedCastData, setSuggestedCastData] = useState([]);
  const [TrendingCastData, setTrendingCastData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [allCasts, setAllCasts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const forYou = require('../assets/Cast_screen_icons/foryou_icon.png');
  const trendingIcon = require('../assets/Cast_screen_icons/trending_icon.png');
  const articleIcon = require('../assets/Cast_screen_icons/article_logo.png');
  const podcastIcon = require('../assets/Cast_screen_icons/podcast_logo.png');
  const [articleData, setArticleData] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      const getUserIdAndRole = async () => {
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedUserRole = await AsyncStorage.getItem('userRole');
        setUserId(storedUserId);
        setUserRole(storedUserRole);
      };
      getUserIdAndRole();
      console.log(userId);
    }, [])
  );
  
  useEffect(() => {
    if (userId) {
      fetchSuggestedCastData();
      fetchTrendingCastData();
      fetchAllCastData();
      fetchArticleData();
    }
  }, [userId]);

  const onRefresh = React.useCallback(() => {
    if (userId) {
      setRefreshing(true);
      fetchSuggestedCastData();
      fetchTrendingCastData();
      fetchAllCastData();
      fetchArticleData();
      setRefreshing(false);
    }
  }, [userId]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    const filteredCasts = allCasts.filter((cast) =>
      cast.title.toLowerCase().includes(text.toLowerCase())
    );
    setSearchResults(filteredCasts);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearchResultPress = (id) => {
    navigation.navigate('SearchResult', { selectedCastId: id });
    console.log(id)
  };

  const fetchAllCastData = async () => {
    try {
      const response = await fetch('http://3.17.219.54/cast');
      const data = await response.json();
      setAllCasts(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchArticleData = async () => {
    try {
      const response = await fetch('http://3.17.219.54/article');
      const data = await response.json();
      setArticleData(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSuggestedCastData = () => {
    const endpoint_suggested_for_you = `http://3.17.219.54/user/${userId}/suggested/for/you`;
    setIsLoading(true);

    fetch(endpoint_suggested_for_you)
      .then((response) => response.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          console.error('Unexpected data format:', data);
          setSuggestedCastData([]);
          setIsLoading(false);
          return;
        }
        const formattedData = data.map((cast) => ({
          id: cast._id,
          image: cast.castimageurl,
          title: cast.title,
          duration: cast.duration,
        }));
        setSuggestedCastData(formattedData);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setIsLoading(false);
      });
  };

  const fetchTrendingCastData = () => {
    const endpoint_trending = `http://3.17.219.54/cast/trending/right/now`;
    setIsLoading(true);

    fetch(endpoint_trending)
      .then((response) => response.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          console.error('Unexpected data format:', data);
          setTrendingCastData([]);
          setIsLoading(false);
          return;
        }
        const formattedData = data.map((cast) => ({
          id: cast._id,
          image: cast.castimageurl,
          title: cast.title,
          duration: cast.duration,
        }));
        setTrendingCastData(formattedData);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setIsLoading(false);
      });
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.refreshIndicator}>
          <ActivityIndicator size="large" color={colors.white} />
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.searchContainer1}>
            <View style={styles.searchBarContainer}>
              <TextInput
                style={styles.searchBar}
                placeholder="Search casts..."
                placeholderTextColor={colors.secondary}
                onChangeText={handleSearch}
                value={searchQuery}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          {searchResults.length > 0 ? (
            searchResults.map((cast) => (
              <TouchableOpacity key={cast._id} onPress={() => handleSearchResultPress(cast._id)}>
                <Text style={styles.searchResultItem}>{cast.title}</Text>
              </TouchableOpacity>
            ))
          ) : searchQuery.trim().length > 0 ? (
            <Text style={styles.noResultsText}>No results.</Text>
          ) : null}
          {searchQuery.trim().length === 0 && (
            <>
              <View style={styles.categoryHeader}>
                <Image source={forYou} style={styles.categoryIcon} />
                <Text style={styles.categoryTitle}>For you</Text>
              </View>
              {SuggestedCastData.length > 0 ? (
                <Carousel list={SuggestedCastData} carouselType="suggested" />
              ) : (
                <Text style={styles.noDataText}>No data.</Text>
              )}
              <View style={styles.categoryHeader}>
                <Image source={trendingIcon} style={styles.categoryIcon} />
                <Text style={styles.categoryTitle}>Trending</Text>
              </View>
              {TrendingCastData.length > 0 ? (
                <Carousel list={TrendingCastData} carouselType="trending" />
              ) : (
                <Text style={styles.noDataText}>No data.</Text>
              )}
              <View style={styles.categoryHeader}>
                <Image source={articleIcon} style={styles.categoryIcon} />
                <Text style={styles.categoryTitle}>Articles</Text>
              </View>
              {articleData.length > 0 ? (
                <ArticleCarousel list={articleData} />
              ) : (
                <Text style={styles.noDataText}>No data.</Text>
              )}
            </>
          )}
        </ScrollView>
      )}
      {(userRole === 'Professor' || userRole === 'Researcher' || userRole === 'PhD Student') && (
        <TouchableOpacity style={styles.floatingButton} onPress={() => navigation.navigate('CastTypeChoice')}>
          <Image 
            source={require('../assets/Cast_screen_icons/plus_icon.png')} 
            style={styles.imageIcon} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 25,
    right: 15,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    backgroundColor: 'transparent',
  },
  imageIcon: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s,
  },
  searchResultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryBis,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: sizes.radius,
    marginRight: spacing.s,
    marginLeft: spacing.xs,
    height: 35,
    elevation: 5,
  },
  searchContainer1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  searchBar: {
    flex: 1,
    fontFamily: 'Montserrat',
    color: colors.white,
    fontSize: sizes.h4,
    paddingLeft: spacing.l,
  },
  clearButton: {
    marginLeft: 10,
    marginRight: 10,
  },
  clearButtonText: {
    color: colors.secondary,
    fontSize: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    marginTop: spacing.s,
    marginLeft: spacing.s,
  },
  categoryTitle: {
    fontSize: sizes.h3,
    color: colors.secondary,
    fontFamily: 'MontserratBold',
  },
  categoryIcon: {
    width: 24,
    height: 24,
    marginRight: spacing.s,
  },
  noResultsText: {
    color: colors.secondary,
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginTop: 20,
  },
  searchResultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
    color: colors.secondary,
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
  },
  noResultsText: {
    color: colors.secondary,
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginTop: 20,
  },
  noDataText: {
    color: colors.secondary,
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 150,
  },
});

export default CastScreen;