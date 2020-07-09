import { createStackNavigator } from 'react-navigation';
import StreamingLoginScreen from "../screens/StreamingLoginScreen";
import StreamingMainScreen from "../screens/StreamingMainScreen";
import CreatePlaylistScreen from "../screens/CreatePlaylistScreen";
import PlaylistDetailScreen from "../screens/PlaylistDetailScreen";
import SearchSongsScreen from "../screens/SearchSongsScreen";
import PlaylistInfoScreen from "../screens/PlaylistInfoScreen";

const StreamingNavigator = createStackNavigator({
        StreamingLogin: {screen: StreamingLoginScreen},
        StreamingMain: {screen: StreamingMainScreen},
        CreatePlaylist: {screen: CreatePlaylistScreen},
        PlaylistDetail: {screen: PlaylistDetailScreen},
        SearchSongs: {screen: SearchSongsScreen},
        PlaylistInfo: {screen: PlaylistInfoScreen},

    },
    {initialRouteName: 'StreamingLogin'});


export default StreamingNavigator;
