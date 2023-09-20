# directdemocracy.vote: Let's Make a Better World!

Date: July 25th, 2023

Version: 0.0.2 (draft)

## Abstract

*directdemocracy.vote* aims at establishing world-wide direct democracy from the bottom-up in order to bring peace, safety and prosperity to humanity, including saving the climate and the biodiversity.
It relies on the Internet, decentralization and cryptography to guarantee a fair voting system.
The principle is that people become citizens by getting trusted by others.
Citizens can vote and propose referendums regardless of any official acknowledgement.
Referendum with a low participation could be ignored or considered as simple survey results.
Referendum with a large participation will become significant from a democratic point of view.
This will increase the pressure on governments to respect the democratic choices expressed by their people.
Eventually, governments will officially recognize and contribute to *directdemocracy.vote*.
The system can be applied locally at the municipal level, or more globally at regional, national or international levels.
Ultimately this bottom-up initiative will enforce direct democracy everywhere in the world, giving the political power to the people.
This paper describes *directdemocracy.vote* from a conceptual, strategical and technical point of view.

## Introduction

When I will be a grand-father, my grandchildren will ask me: "What did you do grandpa to save the world?".
I will answer them: *[directdemocracy.vote](https://directdemocracy.vote)*.

I believe that [direct democracy](https://en.wikipedia.org/wiki/Direct_democracy) is the best political system to address the challenges that the humanity is facing: global warming, biodiversity, overpopulation, human rights, peace and prosperity.
In this political system, any citizen can propose a referendum for a law that will enter in force if a majority of citizens approves it.
Direct democracy is implemented in a few countries, like Switzerland, where it has proved efficient to address local challenges.
However, many decisions, in particular with respect to ecology and peace, cannot simply be taken at the level of a single country.
Instead they should be taken globally.

*directdemocracy.vote* relies on the Internet, decentralization and cryptography to enforce direct democracy from the bottom up to the whole world.
It doesn't require the approval of any government or other official entity to get started.
It can emerge simply from the will of a human beings and impose itself to the world.
It is inspired by the [Municipalism](https://en.wikipedia.org/wiki/Municipalism) and [Communalism](https://en.wikipedia.org/wiki/Murray_Bookchin#Municipalism_and_communalism) theories.
Basically, referendum decisions passed at a higher level (e.g., country) prevail over referendum decisions passed at a lower level (e.g., municipality), thus forming a federal political structure with several levels, which should scale-up to the whole world.

This paper describes how this goal could be achieved today from a technical and strategical point of view.

## Concepts

This section describes the key concepts of *directdemocracy.vote* without entering the technical details.

### Internet, Decentralization and Cryptography

Internet has proven to be a wonderful tool for democracy, in particular regarding the [freedom of speech](https://en.wikipedia.org/wiki/Freedom_of_speech).
Although companies and states are attempting to censor it, the freedom of speech on the Internet is permanently defended by activists, such as [Cypherpunks](https://en.wikipedia.org/wiki/Cypherpunk), who introduce technologies based on decentralization and cryptography, allowing people to work around censorship.
*directdemocracy.vote* leverages on the Internet, decentralization and state-of-the-art cryptography to implement an emerging voting system aiming at the whole humanity.

### Web of Trust

*directdemocracy.vote* relies on [public-key cryptography](https://en.wikipedia.org/wiki/Public-key_cryptography).
Each citizen owns a pair of cryptographic keys: a private key which is held secret and a public key which is published online.
To implement an electronic voting system or a petition signing system, each citizen must have a unique key pair recognized by the system.
To ensure this uniqueness, a [web of trust](https://en.wikipedia.org/wiki/Web_of_trust) is implemented by judges with the help of citizens.

#### Judges

A judge is a [web service](https://en.wikipedia.org/wiki/Web_service) which attributes a reputation each public key supposed to represent uniquely a citizen or a web service.
Anyone can run a judge, regardless of any official acknowledgement. Judges also have a reputation which is given by other judges with the help of citizens.
Hence, judges form a community of web services which permanently evaluate the reputation of public keys for citizens and other web services.

#### Endorsements

In order to help judges in their duties, citizens are asked to endorse each other and to endorse web services.
Endorsing a citizen is the action of publishing a signed message saying "I certify this public key is unique for this citizen".
Endorsing a web service is the action of publishing a signed message saying "I believe this web service is honest and doing a good job".
Judges collect all the endorsements published by the citizens to construct their own web of trust.

#### Reputation

Judges evaluate the reputation of all the participants: citizens, notaries, pooling stations and other judges.
The reputation is a number.
When the reputation of a participant is above a threshold defined by the judge, the judge publishes an endorsement for this partipant.
Polling stations query the notaries to check if a citizen was endorsed by the judge of a referendum.
Anyone can query a judge to get the reputation of a participant.
The judge shall also display publicly the threshold above which it considers that a participant can be trusted.
Judges rely on their own algorithms to compute the reputation of participants.
These algorithms use endorsements as input and may be inspired by the [page rank algorithm](https://en.wikipedia.org/wiki/PageRank).
They may also take into account the date of the endorsements and the distance between the endorsing citizen and the endorsed citizen.
However, their implementation is totally left to the judge.
It is very likely that the endorsements published by different judges will be similar to each other, thus converging towards a consensual web of trust.

#### Optional Judge Information

Some judges may optionally ask citizens to provide them with some private information, which they should keep private.
This information is useful to assess the reputation of citizens, that is one citizen registration corresponds to a single real individual.
It may include local voter registration number, phone number, credit card number, ID card number, passport number, social insurance number, etc.
Such private information should never be made public.
It is managed by judges themselves and is out of the scope of the *directdemocracy.vote* system.
Citizens are free to choose a judge among several for which they feel confident about the management of their private information.
Some judges may not require to ask any private information to citizen.

### Polling Stations

In *directdemocracy.vote* voting is implemented with the help of polling stations.
Polling stations are web services which are responsible for anonymizing the votes of citizens.
Like judges and citizens, polling stations have a reputation and citizens can choose freely which polling station they would like to use.

### Referendums and Petitions

Any citizen may propose a referendum or a petition.
Once a referendum is published, the voting process takes place.
Citizens use polling stations to cast their vote anonymously and the results are published online.
Once a petition is published, the signature process takes place.
Citizen can sign the petition and immediately publish online their signature for this petition.

### Notaries

Notaries are web services receiving publications from participants, including other notaries, and making them public to anyone in the world.
When a participant publishes something, it means that the participant sends a signed message to a notary and the notary makes it publicly available.
Notaries should also communicate with other notaries to gather more publications.
A good notary is a notary which publishes all the available publications of *directdemocracy.vote*.
Notaries also provide a web user interface to allow anyone to search and browse the various publications.

## Properties

This section describes the essential properties of the *directdemocracy.vote* system necessary to convince people to use it.

### Easy-to-Use

The system is aimed at gaining confidence of both technical and non-technical people.
The registration, endorsement, referendum vote, petition signature, verification and other processes are easy-to-understand.
The smartphone app makes it quickly available.

### Privacy Respectful

All the information provided by citizens is public and available to everyone.
It is not stored on a private server.
This guarantees that this information cannot be retained or sold.
Citizens should publish a minimal amount of information about themselves: name, picture and GPS home location.
This is necessary to declare to others their existence as a citizen.
However, if publishing the picture is a problem for a citizen, it may be possible to publish a blank picture.
Similarly, if publishing the GPS home location is a problem, it may be possible to publish the GPS location of the town hall of the city where the citizen lives.
Also other publications are needed by the voting process, like the participation of a citizen to a referendum.
Such publications are publicly available online and cannot be removed (although they can be revoked by their authors).
It is a bit similar to what happens with crypto currencies where the transaction information is publicly stored in a blockchain.

### Free and Open Source

The voting software is freely available to anybody with Internet access from a simple smartphone.
There is no special requirement (ID card, phone number, credit card, e-mail address, etc.), except those imposed by the app store of the smartphone.
Anyone can install the software for free, register, propose referendums and vote.
All the system relies exclusively on open-source specifications and open-source software.
The only component of the system which is not free and not fully open-source is the smartphone.

### Verifiable

Any citizen can check that their vote was taken into account.
Anyone can check whether the voting process went well and nobody cheated.

### Anonymous

It is not possible to know what a citizen voted.

### Decentralized and Open

Similarly to the [Bitcoin](https://en.wikipedia.org/wiki/Bitcoin) and other distributed systems, nobody controls *directdemocracy.vote*, it simply belongs to its users.
Anyone can contribute to *directdemocracy.vote* by implementing their own web services, such as apps, judges, polling stations or notaries, that will immediately take part in the network and try to gain a good reputation.

### Simple and Secure

The technical concepts used in *directdemocracy.vote* are fairly simple and easy-to-understand for computer scientists.
The architecture is kept as simple as possible to make it easy to review and assess its security.
It doesn't aim at being 100% secure, as 100% secure things do not exist in the real world.
It favors simplicity over unnecessary complications.
It aims at being at least as secure as existing voting systems.
The security architecture mainly focuses on being robust against large scale hacking attempts.

### Robust to Attacks

Hackers cannot change the results of a vote and cannot sabotage a referendum.

### Preventing Vote Buying

It is very difficult for a voter to prove to someone else what they voted.
Hence, selling ones vote is almost impossible, especially at large scale.

## Principles

### Participants

There are 6 different types of participants in *directdemocracy.vote*:
- **citizens**: they issue their citizen card, endorse other participants, create petitions and referendums, sign and vote.
- **smartphone providers**: they provide mobile phones used by the citizens (Android, iOS, etc.).
- **app providers**: they provide mobile apps running on the smartphone of the citizen and allowing them to participate to *directdemocracy.vote*.
- **notaries**: they receive publications from all the participants (including other notaries) and make them public on the web.
- **judges**: they compute and publish a reputation for each participant.
- **polling stations**: they provide anonymity of vote in referendums.

### Cryptography

Each participant has its own cryptographic key pair to allow it to sign its publications.
It is a 2048-bit key pairs using the RSA algorithm.
The hash algorithm used for signatures is SHA-256.
The standard commands to generate a RSA key pair with 2048 bits are:
```
openssl genpkey -algorithm RSA -out id_rsa -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in id_rsa -out id_rsa.pub
```
Where `id_rsa` is the private key and `id_rsa.pub` is the public key.
These commands can be used for any participant except citizens.

The private key of a citizen is generated, stored and operated by some special hardware of the smartphone, so that it cannot be read by anyone.
Smartphone operating systems actually provide a hardware-based API allowing to generate a key pair, sign, encrypt and perform other operations without disclosing the private key.
This is implemented in the [Android Keystore](https://source.android.com/docs/security/features/keystore) and [Apple iOS Secure Enclave](https://developer.apple.com/documentation/security/certificate_key_and_trust_services/keys/protecting_keys_with_the_secure_enclave).
The app also generates a password protected revocation message that the participant should save and use if they loose access to their smartphone.

The operating system of the smartphone also provides integrity checks on itself and on the app.
The app integrity check prevents malicious users from using a modified app to cheat or to extract sensitive data.
The operating system integrity check prevents malicious users from modifying the behavior of the app at run-time or extracting sensitive data.
These features are currently offered by the [Android Play Integrity](https://developer.android.com/google/play/integrity) and the [Apple iOS DeviceCheck](https://developer.apple.com/documentation/devicecheck).
They require however that the app is provided through the official app store of the operating system.

### Publications

A publication is a JSON file including the signature of a participant and published online.
It includes the public key and signature of the participant to guarantee that the publication was created by this participant.
All publications includes at least the following fields:
```yaml
schema: [url of the json-schema file]
key: [public key of author]
signature: [signature of author]
published: [date of publication expressed in milliseconds since 1970-01-01 00:00:00.000]
```

The public keys stored in JSON structures are stripped down version of the standard public key.
The header and footer line are suppressed as well as the new lines.
Considering the following public key:
```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkoSFvGywo4sb0crZlmDJ
R7iOSSioDS/ujo4dI0ISYezTVSBnuMvdEtCNfjIXUXy5fMbemrCB8GaragdJQf3w
5xCKYjVSHlU2CEglTz0tgKTfm00/eoBPoW0oEaHRovVkwtaMDECvN8DyWBsA0XqV
GXQsSYa3WA9s0CaaWv9+za1N1Lfv6gKxXMItWcMBcBnPqj2mcl3qgbp635maIkSM
k9/ybH80kv8lxkc/VFsAWsLykcMSZdgNWaxWvNXl6zES8ZkNfOnXHYztbIm25Hjr
ixjan50H4C04HkvvLILFXsNylxOz7vZNYauO6Oh2Jn8IkKzTtXuxaLmh7KuzrLSk
1QIDAQAB
-----END PUBLIC KEY-----
```
The value stored as a string in the JSON structure is:
```
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkoSFvGywo4sb0crZlmDJR7iOSSioDS/ujo4dI0ISYezTVSBnuMvdEtCNfjIXUXy5fMbemrCB8GaragdJQf3w5xCKYjVSHlU2CEglTz0tgKTfm00/eoBPoW0oEaHRovVkwtaMDECvN8DyWBsA0XqVGXQsSYa3WA9s0CaaWv9+za1N1Lfv6gKxXMItWcMBcBnPqj2mcl3qgbp635maIkSMk9/ybH80kv8lxkc/VFsAWsLykcMSZdgNWaxWvNXl6zES8ZkNfOnXHYztbIm25Hjrixjan50H4C04HkvvLILFXsNylxOz7vZNYauO6Oh2Jn8IkKzTtXuxaLmh7KuzrLSk1QIDAQAB
```

There are mainly 8 types of publications in *directdemocracy.vote*:

- citizen
- endorsement
- area
- proposal (referendum or petition)
- participation
- registration
- ballot
- vote

#### Citizen

Becoming a citizen means publishing some information about oneself: name, picture and GPS home location.
This information is immediately made public through the notary services.
No other information is asked to the user in the registration process.
Anyone can register on *directdemocracy.vote* to publish their own citizen publication, e.g., citizen card.
However, this is not sufficient to take part in a referendum, so that their vote is taken into account.
Citizen publications must be endorsed by the judge of the referendum so that the corresponding citizen can vote.
To get endorsed by the judge, a citizen should acquire a sufficiently high reputation from that judge.
To increase their reputation, a citizen should ask other citizens to endorse them.
Alternatively, they may also ask some judges to endorse them.
Judges compute the reputation of a citizen based on endorsements by citizens and by other judges.
If a citizen has a large number of endorsements from citizens and/or judges with a good reputation, their reputation will increase and they will get endorsed by more and more judges.

A [citizen](https://directdemocracy.vote/json-schema/0.0.2/citizen.schema.json) publication contains the name, picture and GPS home location of a citizen.
It is signed by the citizen themself.

Example:
```yaml
schema: https://directdemocracy.vote/json-schema/0.0.2/citizen.schema.json
key: [citizen public key]
signature: [citizen signature]
published: 1590298858399
familyName: Smith
givenNames: John
picture: [base64 encoded jpeg picture]
latitude: 40.724723
longitude: -73.993403
```

#### Endorsement

The [endorsement](https://directdemocracy.vote/json-schema/0.0.2/endorsement.schema.json) of a participant includes the public key of the participant signed by another participant.
In case of the endorsement of a citizen, it claims that the owner of this citizen card is eligible to vote, e.g., the citizen card is owned by an adult person who own a single citizen card.
Otherwise, in case of the endorsement of a web service or an app, it means that the web service or app is honest and provides a good quality of service.

An important endorsement is the integrity endorsement signed by the app provider which means that a citizen registered their citizen card using the genuine app running on a non-rooted unmodified smartphone.
A citizen card failing to receive an integrity endorsement from a trusted app provider should not be trusted.

A **revocation** is a special kind of endorsement meant to revoke a publication. It has its revocation field set to true. A revocation can be published by a citizen to revoke her own citizen card. Then, they may create a new card with the same public key or a new public key. Revocations are also published by participants to cancel endorsements they previously published.

Example:
```yaml
schema: https://directdemocracy.vote/json-schema/0.0.2/endorsement.schema.json
key: [citizen1 public key]
signature: [citizen1 signature]
published: 1590298858399
revoke: true
endorsed:
  key: [citizen2 public key]
  signature: [citizen2 signature]
```

#### Area
An [area](https://directdemocracy.vote/json-schema/0.0.2/area.schema.json) represents geographic zones defined by a set of polygons and used to delimit the boundaries of a referendum. Polygons are expressed as coordinates in the GeoJSON MultiPolygon format.
The name field is used for user information purposes only.
It should match the area field of the referendum.
It is self-signed.

Example:
```yaml
schema: https://directdemocracy.vote/json-schema/0.0.2/area.schema.json
key: [public key of participant]
signature: [signature of participant]
published: 1574679658399
name: |
  city=Mâcon
  county=Saône-et-Loire
  state=Bourgogne-Franche-Comté
  country=France
  union=European Union
polygons: [[[[ 12.123, 123.121 ], [12.112, 134.113], [12.321. 107.122]]]]
```

#### Proposal: Referendum or Petition
A referendum [proposal](https://directdemocracy.vote/json-schema/0.0.2/proposal.schema.json) contains a description of the referendum and the question asked to the citizen.
It is self-signed.

Example:
```yaml
schema: https://directdemocracy.vote/json-schema/0.0.2/proposal.schema.json
key: [public key of participant]
signature: [signature of participant]
published: 1574679658399
judge: https://judge.directdemocracy.vote
area: |
  city=Mâcon
  county=Saône-et-Loire
  state=Bourgogne-Franche-Comté
  country=France
  union=European Union
title: my referendum
description: my description
question: do you agree?
answers: |
  yes
  no
  abstain
secret: true
deadline: 1590298858399
website: https://www.myreferendum.net
```

A petition [proposal](https://directdemocracy.vote/json-schema/0.0.2/proposal.schema.json) is similar to a referendum proposal, except that it has its `secret` field set to `false` and has no `question` nor `answers` fields.

#### Participation

A [participation](https://directdemocracy.vote/json-schema/0.0.2/participation.schema.json) is a declaration by a polling station that it is participating to a referendum and can handle the votes of the citizens on it.
It also includes the public key of the *participation* key pair which was forged by the station specifically for this referendum.

Example:
```yaml
schema: https://directdemocracy.vote/json-schema/0.0.2/participation.schema.json
key: [public key of station]
signature: [signature of station]
published: 1590298858399
participation: [public key of participation generated by station]
```

#### Registration
A [registration](https://directdemocracy.vote/json-schema/0.0.2/registration.schema.json) contains a the public key of a referendum and is signed by both a citizen and a station.
It means the citizen has secretly voted to the specified referendum in the specified station.

Example:
```yaml
schema: https://directdemocracy.vote/json-schema/0.0.2/registration.schema.json
key: [public key of citizen]
signature: [signature of citizen]
published: 1590298858399
participation: [public key of participation generated by station]
```

#### Ballot
A [ballot publication](https://directdemocracy.vote/json-schema/0.0.2/ballot.schema.json) contains the public key of a referendum, the answer to the question asked in the referendum.
Secret ballots are signed by a station.
Public ballots are signed by citizens.

Example:
```yaml
schema: https://directdemocracy.vote/json-schema/0.0.2/ballot.schema.json
key: [public key of citizen]
signature: [signature of citizen]
published: 1590298858399
participation: [public key of participation]
vote: [encrypted vote]
```

#### Vote
A [vote](https://directdemocracy.vote/json-schema/0.0.2/vote.schema.json) publication contains the actual vote of a citizen, signed by the participation key of the polling station. The information in the vote field include both the answer and random bits guarantying the uniqueness of the vote.

Example:
```yaml
schema: https://directdemocracy.vote/json-schema/0.0.2/vote.schema.json
key: [public key of participation]
signature: [signature of participation]
published: 1590298858399
vote: [vote]
```

## Petitioning
This section describe the full petitioning process in details.
Petitioning is way simpler to handle than voting because it doesn't involves anonymity.
The petition system of *directdemocracy.vote* is superior to most Internet-based petitions systems.
Such systems rely on e-mail addresses for signature and cannot prevent people from signing several times if they have several e-mail addresses.
Moreover, in case of a local petition, such systems cannot prevent people from outside of the geographical area to sign.
The petition system of *directdemocracy.vote* fixes these two shortcomings by relying on the citizen reputation coming from the web of trust.

### Petition Publication
A petition is published as a proposal by a participant.

### Signatures
Any citizen located in the area of the petition and approving it will publish an endorsement for it.

### Counting
Notaries could display the result of a petition by counting and listing the citizens who signed it, excluding non-trusted citizens and citizens outside of the petition area.

## Voting
This section describe the full voting process in details.

### Process
The voting process is summarized on the following figure:

<img src="https://raw.githubusercontent.com/directdemocracy-vote/www/master/httpdocs/images/blind-vote.webp" alt="Voting Process"/>

#### Referendum Publication

A referendum with public a key *R* is published with a reference to the public key *J* of a judge.

#### Polling Station Participation

A polling station with a public key *S*, which is trusted by the *J*, decide to participate to referendum *R* by generating a public key *B* and it corresponding private key and publishing a *participation* blob signed with its *S* key and containing *B* together with *R*.
A polling station should publish only one *participation* per referendum, otherwise, it will be distrusted.

#### Citizen Registration

A citizen with public key *A* announces their *registration* to referendum *R* at polling station *S*.
The app used by *A* should ensure that *S* is endorsed by *J*.
The app generates a vote blob *V* which contains a publication date in the future, a unique random ballot number and the answer of the citizen to the referendum question.
The answer could be "yes", "no", "abstain" or something else.
The app encrypts *V* with the private key of *A* to generate *V<sup>a</sup>*, adds *B*, publish this signed blob and informs *S* about it.
The encryption algorithm used by the app to generate *V<sup>A</sup>* supports [blind signature](https://en.wikipedia.org/wiki/Blind_signature).

#### Polling Station Check

*S* determines if *A* is allowed to vote to *R*.
*A* is allowed to vote to *R* if they are endorsed by *J* and are located in the area of *R*.
Also, *A* should not be in the process of voting in another station, e.g., there should not be any *ballot* message for *A* and *R* published by another station.
Moreover, *A* should be endorsed by the app (integrity check) and the app should be endorsed by *J*.
If *A* is allowed to vote, the station publishes a *ballot* message containing the encrypted vote *V<sup>A</sup>* blindly signed by *B* and informs *A* about it.

#### Vote

*A* gets the *V<sup>A</sup>* blob signed by *B*, decrypts it and publishes the result which holds the unblinded signature *b'*.
This vote is perfectly anonymous because the polling station cannot link the unblinded signature of *B* (noted *b'*) with the original blind signature (noted *b*).
It is also verifiable by the app since the app knows the unique ballot number included in *V*.

### Special Cases

#### Vote Buying Prevention

The app should include an optional "hide-vote" feature to discourage vote buying attempts.
When voting, the citizen has the option to click the "hide-vote" checkbox.
If they do it, their vote won't take place immediately and the app will look like they never voted to this referendum.
However, their original answer to the vote will be remembered by the app and used whenever they vote again to the same referendum without the "hide-vote" option checked.
Imagine that a citizen votes "yes" with the "hide-vote" option checked.
Then, a vote buyer ask them to show their phone, they will see that the citizen didn't vote yet.
If they force the citizen to vote "no", the citizen will do so in front of the vote buyer and a "yes" will be casted.
Hence the vote buyer cannot be sure that the citizen actually voted as they told them to do.
Note however, that in case the citizen first check the "hide-vote" option, they won't be able to verify their vote afterwards: the verification will always display a vote corresponding to the answer of the second vote to fool the possible buyer.

#### Station not Responding

If *S* doesn't answer quickly to the *registration* of *A* by publishing a corresponding *ballot* publication, then the original *registration* of *A* can be considered as obsolete by other stations, which can accept a new registration for *A*. As a consequence, *S* will get bad reputation.

#### Vote Ballot Mismatch

If for a *S<sub>R</sub>* there is more *votes* than *ballots*, then the station is considered as cheating.
If that happens, the reputation of the station is immediately distrusted and all its *votes* and *ballots* are ignored.
This is unlikely to happen as the interest of stations is to maintain a high reputation on a large number of referendums.

#### Citizen Voting Twice

A trusted app cannot let *A* vote twice to *R*.
Even if that would happen, *S* would detect it and refuse to publish the requested *ballot*.

### Display of the Results

#### Start of the Display of the Results

The display of the results of *R* starts as soon as a first vote is published.
The first vote of a station is published only after several *ballots* are published for the same station.
Otherwise, observers would know what the first registered citizen has voted.
The results are pretty simple to compute: we should list all the *votes* for all the stations taking part in the referendum.
For each possible answer, all the *votes* corresponding to this answer are summed up and the final sum is displayed.
The answer is computed from the first bits of the hash contained in the *vote*.

#### Final Results

The results are displayed continuously until the deadline of the referendum is reached.
At this point the results are final and any vote published after the deadline should be ignored.
This allows observers to follow the participation and outcome of the referendum.
This may also encourage more citizens to vote especially if the results appears to be tied.

#### Participation

To estimate the participation, we should first estimate the size of the corpus, that is the number of citizens living of the area of the referendum.
This information can be obtained from various sources, including OpenStreetMap.
The estimated participation is computed from the number of votes divided by the size of the corpus.

## Features and Limitations of the Voting System

A perfect anonymous voting system doesn't exists.
The system we propose has a number of minor shortcomings explained in this section.
However, such limitations should not affect significantly the democratic process.

### Dependency on Google and Apple

Unfortunately, nowadays the vast majority of smartphones run either Google Android or Apple iOS proprietary systems which constitutes a strong dependency on the companies providing these devices.
We currently have no other choice than trusting these smartphones with respect to the integrity check and keystore in particular.
However, for users who are running their own rooted devices or alternative operating systems, we recommend them to have a spare cheap genuine Android smartphone that they could use only for running the trusted integrity checked *directdemocracy.vote* apps.
In the future, the might be other hardware and software providers offering devices with integrity checks as an alternative to Google and Apple.
Unlike Google and Apple, such new systems could be publicly audited from both a hardware and software point of view to guarantee they do not include any backdoor and thus would gain a better reputation.

### Necessity to Have a Smartphone

People without a smartphone are unfortunately unable to vote.
However today [a large percentage of the adult population has a such a device](https://en.wikipedia.org/wiki/List_of_countries_by_smartphone_penetration) and it is increasing every day.

### Malicious Polling stations

A malicious polling station may misbehave, but this will be visible by all.
If that happens, all the votes handled by this stations will be discarded.
All the honest citizens who voted through this polling station will loose their vote.
And the polling station will get a bad reputation from most of the judges and won't be used any more.
A polling station handling a large number of votes is however unlikely to misbehave.
This is because to have a large number of votes, a polling station should have a high reputation.
And a high reputation is only possible if the station never misbehaved.
If it misbehaves once, it will immediately loose its reputation and be excluded for the next referendums.

### Other Malicious Participants

Any malicious participant could be spotted by other participants and its reputation will immediately drop, excluding the malicious participant from further participation in *directdemocracy.vote*.

### Vote Buying

It is not possible for a citizen to prove what they voted or sell their vote, unless the citizen sell their smartphone to some buyer after they acquired a high trust level.
This is however unlikely to happen at large scale without being discovered.
Also the sold citizen card could not get nor provide any further fair endorsement which will appear suspect after a while.
That includes judge endorsements which may happen on regular time intervals.
When discovered, a citizen who sold his smartphone with access to their *directdemocracy.vote* app, is unlikely to get trusted again in the future.

## Implementation

### Sample Implementation

A fully working open-source implementation is provided on https://directdemocracy.vote
It includes a minimal working system:
- a [smartphone app](https://app.directdemocracy.vote) for both Android and iOS.
- a [notary](https://notary.directdemocracy.vote).
- a [judge](https://judge.directdemocracy.vote) implementing a simple [page rank algorithm](https://en.wikipedia.org/wiki/PageRank) among citizens to compute their reputation.
- a [polling station](https://station.directdemocracy.vote).

The source code is available at https://github.com/directdemocracy-vote/
This system may be used for testing purposes, or for implementing local referendums (at the municipality level).
But it is not yet ready to scale up at a larger levels, mainly due to the capacity of the servers used.

### Scaling-up

It is easy for any individual computer scientist or organization to deploy their own servers (notaries, judges and stations).
By increasing the number of servers, the system will be able to handle a larger number of citizens, and eventually the whole humanity.

### Improved Implementations

The open source software can be forked to create new versions of the app and web services.
The resulting new software should respect the specifications to be inter-operable with other implementations.
The current sample implementation the app and web services is minimal and could be greatly improved by developers.
Improvements include a better user interface of the app, better judges algorithms, better data exchange between notaries, etc.

## Strategy

We aim at getting *directdemocracy.vote* used by a large number of citizens to increase the pressure on local government and thus contribute to a better, more democratic governance of countries.
In order to achieve this goal, we plan to start small with local petitions and/or referendum in small municipalities, like villages.
It is likely that there exist many villages in the world where a majority of people disagrees with the local municipality on some topic.
Thus a couple of citizens in one of these villages may decide to use *directdemocracy.vote* to organize a local referendum.
The local municipality may decide to ignore the outcome of the referendum.
However, the local news may relay the fact that some citizens self-organized a referendum to increase the pressure on the municipality.
This will have a side effect to spread the word about *directdemocracy.vote* and encourage other villages or cities to use it.
At some point, citizens will launch a referendum for a whole region, then a whole country.
This self-feeding marketing will eventually outreach the whole planet.

## Roadmap

1. First Municipal Referendum
    1. Participation Level Greater Than 50%
    2. Media Coverage
    3. Results Acknowledged and Applied

2. First Regional Referendum
    1. Participation Level Greater Than 50%
    2. Media Coverage
    3. Results Acknowledged and Applied

3. First National Referendum
    1. Participation Level Greater Than 50%
    2. Media Coverage
    3. Results Acknowledged and Applied

4. First World Referendum
    1. Participation Level Greater Than 50%
    2. Media Coverage
    3. Results Acknowledged and Applied

## Conclusion

This project has the capability to have a real positive impact on the future of humanity and Earth.
However, its success depends on the people living on this planet.
You certainly can help now to achieve such a bright future:

- Spread the word about *directdemocracy.vote*!
- Propose local referendums or petitions!
- Participate to the democratic debates!
- Endorse others!
- Vote!
- Develop and run a judge, a polling station, a notary or an app!
- Force the rulers to respect the outcome of the referendums!

Your grandchildren will thank you for this.
