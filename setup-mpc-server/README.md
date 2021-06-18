# setup-mpc-server

This project contains the coordination server for the Latticex Trustless Setup Multi-Party Computation.

It provides a simple JSON API for coordination of all participants in the ceremony.

All state modifying functions expect an `X-Signature` header, the specifics are outlined per endpoint below.

## Endpoints

### Get Current Server State

`GET /api/state[?sequence=1234]`

Return current ceremony state. If a sequence number is provided, only return participants that have changed since this sequence number.

### Reset Server State

`POST /api/reset`

Reset the server. Provide a starting state in the body. `startTime` and `endTime` are relative from now in seconds if given as a number, or absolute if given as an ISO date string. `selectBlock` is relative from the latest block if negative, otherwise absolute.

`Body`

```
{
	"startTime": 10,
	"endTime": 60,
	"selectBlock": -1,
	"invalidateAfter": 7600,
	"filesCount": 17,
	"maxTier2": 100,
	"minParticipants": 1,
	"participants": [
		"atp10fy6qc99mfzkvwzc4wqn63hvttgahs66cgrwe3",
		"atp1wxadw8yzr6qxdw5yl3f2surp6ue6f03ekgqqlh",
		"atp1v79jh55uq97k2ueqf7f2um2yy8a5jsnxzfpdr8",
		"atp15c2697lu35juh4gc9pa2acp069mjfq85z9x8sv",
		"atp1r23vf7kahe5cx0j430ywm2xc4gwacl9a9hny0u",
		"atp15xrye42ffll2rhtq5we7npg2sakulul6faws2x"
	]
}
```

`X-Signature`

The text `SignMeWithYourPrivateKey`, signed by the admin address.

### Patch Server State

`PATCH /api/state`

Allows modification of parts of the server state. Conditions apply in regards to current server state.

`Body`

```
{
	"minParticipants": 10
}
```

`X-Signature`

The text `SignMeWithYourPrivateKey`, signed by the admin address.

### Add Participant

`PUT /api/participant/<address>`

Add a participant with tier level 2.

`X-Signature`

The text `SignMeWithYourPrivateKey`, signed by the admin address.

### Update User Progress

`PATCH /api/participant/<address>`

Updates telemetry around a participants progress.

`Body`

```
{
  "runningState": "RUNNING",
  "computeProgress": 10.12,
  "transcripts": [
    {
      "size": 1000000,
      "downloaded": 1000,
      "uploaded": 0,
    }
  ]
}
```

`X-Signature`

The body as returned by `JSON.stringify`, signed by the participant address.

### Ping User Online

`GET /api/ping/<address>`

Marks a participant as online. Must be called within every 10 seconds to ensure a user stays online.

`X-Signature`

The word `ping`, signed by the participant address.

### Download Transcript Signature

`GET /api/signature/<address>/<num>`

Download a given participants transcript signature.

### Download Transcript

`GET /api/data/<address>/<num>`

Download a given participants transcript.

### Upload Transcript

`PUT /api/data/<address>/<num>`

Uploads a given participants transcript.

`Body`

The transcript file.

`X-Signature`

Two signatures, comma delimited. The first is the word `ping`, signed by the participant address. The second is the SHA256 sum of the transcript file, signed by the participant address.
