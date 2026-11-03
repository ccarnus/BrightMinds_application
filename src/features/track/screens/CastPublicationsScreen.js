import React from 'react';
import PublicationsList from '@features/track/components/PublicationsList';

const CastPublicationsScreen = ({ navigation }) => (
  <PublicationsList
    navigation={navigation}
    title="Your Casts"
    searchPlaceholder="Search your casts.."
    publicationsKey="castPublications"
    endpoint="cast"
    imageKey="castimageurl"
    itemLabel="cast"
  />
);

export default CastPublicationsScreen;