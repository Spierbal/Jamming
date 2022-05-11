const clientId = "317c8ed1f357448c81c8c9f0085291fb";
const redirectURI = "http://localhost:3000";
let userAccessToken;

const Spotify = {
  getAccessToken() {
    if (userAccessToken) {
      return userAccessToken;
    }
    const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
    const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

    if (accessTokenMatch && expiresInMatch) {
      userAccessToken = accessTokenMatch[1];
      const expiresIn = Number(expiresInMatch[1]);
      window.setTimeout(() => (userAccessToken = ""), expiresIn * 1000);
      window.history.pushState("Access Token", null, "/");
      return userAccessToken;
    } else {
      const redirectUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`;
      window.location = redirectUrl;
    }
  },

  async search(term) {
    const userAccessToken = Spotify.getAccessToken();
    const response = await fetch(
      `https://api.spotify.com/v1/search?type=track&q=${term}`,
      {
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
        },
      }
    );
    const jsonResponse = await response.json();
    if (!jsonResponse.tracks) {
      return [];
    }
    return jsonResponse.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      uri: track.uri,
    }));
  },

  async savePlaylist(name, trackURIs) {
    if (!name || !trackURIs.length) {
      return;
    }
    const userAccessToken = Spotify.getAccessToken();
    const headers = { Authorization: `Bearer ${userAccessToken}` };
    let userId;

    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: headers,
    });
    const jsonResponse = await response.json();
    userId = jsonResponse.id;
    const newPlaylistResponse = await fetch(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        headers: headers,
        method: "POST",
        body: JSON.stringify({ name: name }),
      }
    );
    const jsonPlaylistResponse = newPlaylistResponse.json();
    const playlistId = jsonPlaylistResponse.id;
    const trackToPlaylistResponse = await fetch(
      `https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`,
      {
        headers: headers,
        method: "POST",
        body: JSON.stringify({ uris: trackURIs }),
      }
    );
    if (trackToPlaylistResponse.ok) {
      return;
    }
  },
};
export default Spotify;
