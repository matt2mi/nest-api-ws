import * as React from 'react';
import { Redirect } from 'react-router';
import * as io from 'socket.io-client';
import { Result, Score } from '../types';
import Socket = SocketIOClient.Socket;

interface Props {
    readonly pseudo: string;
    readonly results: Result[];
    readonly scores: Score[];
}

interface State {
    readonly goNext: boolean;
    decounter: number;
}

export default class Results extends React.Component<Props, State> {

    wrongAnswer = {
        border: '1px solid red'
    };
    goodAnswer = {
        border: '1px solid green'
    };
    socket: Socket;

    constructor(props: Props) {
        super(props);

        this.nextQuestion = this.nextQuestion.bind(this);
        this.startTimer = this.startTimer.bind(this);

        const url = window.location.href;
        this.socket = io.connect('http://' + url.slice(7, url.length).split(':')[0] + ':3001');
        this.socket.on('nextQuestion', this.nextQuestion);

        this.state = {
            goNext: false,
            decounter: 10
        };
        this.startTimer();
    }

    startTimer() {
        if (this.state.decounter >= 0) {
            setTimeout(() => {
                this.setState({decounter: this.state.decounter - 1});
                this.startTimer();
            }, 1000);
        }
    }

    nextQuestion() {
        this.setState({goNext: true});
    }

    render() {
        if (this.state.goNext) {
            return (<Redirect to="/playing"/>);
        }
        return (
            <div className="base-div-content">
                <div className="row">
                    <div className="card">
                        <div className="card-header">
                            Resultats !
                        </div>
                        <div className="card-block p-3 ">

                            {this.props.results.map(res => (
                                <div
                                    className="col m-1"
                                    style={res.liarPseudo === 'truth' ? this.goodAnswer : this.wrongAnswer}
                                    key={res.id}
                                >
                                    {
                                        res.liarPseudo === 'truth' ?
                                            res.playerPseudo + ' a choisi la bonne réponse (' + res.lieValue +
                                            ') +500 !'
                                            :
                                            res.liarPseudo === 'gameLie' ?
                                                res.playerPseudo + ' a choisi notre mito (' + res.lieValue +
                                                ') -400 !'
                                                :
                                                res.playerPseudo + ' a choisi le mito de ' + res.liarPseudo +
                                                ' (' + res.lieValue + ') +200 pour ' + res.liarPseudo
                                    }
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="row">
                    Scores !
                </div>
                <div className="row">
                    {this.props.scores.map(score => (
                        <div className="col-2" key={score.id}>
                            {score.pseudo}
                        </div>
                    ))}
                </div>
                <div className="row">
                    {this.props.scores.map(score => (
                        <div className="col-2" key={score.id}>
                            {score.value}
                        </div>
                    ))}
                </div>
                <div className="row">
                    {this.state.decounter}
                </div>
            </div>
        );
    }
}