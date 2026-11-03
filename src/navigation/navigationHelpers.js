const getRootNavigation = (navigation) => {
  let root = navigation;
  while (root.getParent && root.getParent()) {
    root = root.getParent();
  }
  return root;
};

// Clears history so the user cannot navigate "back" into a signed-in/signed-out session.
export const resetToAuthChoice = (navigation) =>
  getRootNavigation(navigation).reset({ index: 0, routes: [{ name: 'AuthChoice' }] });

export const resetToHome = (navigation, tab) =>
  getRootNavigation(navigation).reset({
    index: 0,
    routes: [{ name: 'BottomNav', params: tab ? { screen: tab } : undefined }],
  });
