const express = require("express");
const path = require("path");

const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let database = null;
// Connecting the server and database
const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db error ${e}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

//API 1
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT * FROM player_details;`;
  const player = await database.all(getPlayerQuery);
  response.send(player.map((each) => convertDbObjectToResponseObject(each)));
});
//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT *
    FROM player_details
    WHERE player_id=${playerId};`;
  const playerArray = await database.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObject(playerArray));
});
//update query API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE 
        player_details
    SET 
        player_name = '${playerName}'
    WHERE 
        player_id=${playerId};
    `;
  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchesQuery = `
        SELECT * 
        FROM 
            match_details
        WHERE 
            match_id=${matchId}
        ;`;
  const matchDetails = await database.get(getMatchesQuery);
  response.send({
    matchId: matchDetails.match_id,
    match: matchDetails.match,
    year: matchDetails.year,
  });
});
const convertDbPlayerMatchObjectToResponse = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
//API 5
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchQuery = `
    SELECT * 
    FROM 
        player_match_score 
        NATURAL JOIN match_details
    WHERE 
        player_id= ${playerId};`;

  const playerMatch = await database.all(getMatchQuery);
  response.send(
    playerMatch.map((each) => convertDbPlayerMatchObjectToResponse(each))
  );
});
const convertDbMatchPlayerObjectToResponse = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayers = `
        SELECT
        *
        FROM player_match_score
        NATURAL JOIN player_details
        WHERE
        match_id = ${matchId};
    `;

  const matchPlayers = await database.all(getMatchPlayers);
  response.send(
    matchPlayers.map((eachPlayer) =>
      convertDbMatchPlayerObjectToResponse(eachPlayer)
    )
  );
});
//API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoreQuery = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const playerScore = await database.get(getPlayerScoreQuery);
  response.send(playerScore);
});
module.exports = app;
