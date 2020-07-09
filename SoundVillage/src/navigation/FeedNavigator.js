import { createStackNavigator } from 'react-navigation';
import PlaylistDetailScreen from "../screens/PlaylistDetailScreen";
import MainFeed from "../screens/MainFeed";
import SearchSongsScreen from "../screens/SearchSongsScreen";
import PlaylistInfoScreen from "../screens/PlaylistInfoScreen";
import MainNavigator from "./MainNavigator";

const FeedNavigator = createStackNavigator({
        MainFeed: {screen: MainFeed},
        PlaylistDetail: {screen: PlaylistDetailScreen},
        SearchSongs: {screen: SearchSongsScreen},
        PlaylistInfo: {screen: PlaylistInfoScreen},

    },
    {initialRouteName: 'MainFeed'});

export default FeedNavigator;