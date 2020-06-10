import { createStackNavigator } from 'react-navigation';
import Profile from "../screens/Profile";
import PlaylistDetailScreen from "../screens/PlaylistDetailScreen";
import SearchSongsScreen from "../screens/SearchSongsScreen";
import PlaylistInfoScreen from "../screens/PlaylistInfoScreen";

const ProfileNavigator = createStackNavigator({
        Profile: {screen: Profile},
        PlaylistDetail: {screen: PlaylistDetailScreen},
        SearchSongs: {screen: SearchSongsScreen},
        PlaylistInfo: {screen: PlaylistInfoScreen},

    },
    {initialRouteName: 'Profile'});


export default ProfileNavigator;