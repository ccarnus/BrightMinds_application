import React from 'react';
import PublicationsList from '@features/track/components/PublicationsList';

const ArticlePublicationsScreen = ({ navigation }) => (
  <PublicationsList
    navigation={navigation}
    title="Your Articles"
    searchPlaceholder="Search your articles.."
    publicationsKey="articlePublications"
    endpoint="article"
    imageKey="articleimageurl"
    itemLabel="article"
  />
);

export default ArticlePublicationsScreen;