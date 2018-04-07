import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import 'rxjs/add/observable/from';
import 'rxjs/add/operator/map';
import { PlayersService } from '../players/players.service';
import { QuestionsService } from '../questions/questions.service';
import { Answer, Player } from '../types';

@WebSocketGateway({port: 3001})
export class EventsGateway {
    @WebSocketServer() webSocketServer;
    nbAnswers = 0;
    nbRounds = 1;

    constructor(private readonly playersService: PlayersService,
                private readonly questionsService: QuestionsService) {
    }

    @SubscribeMessage('disconnect')
    disconnect(socketClient: Object): void {
        const pseudo = this.playersService.getPseudoFromPlayersMap(socketClient);
        if (pseudo !== undefined) {
            console.log('disconnect', pseudo);
            this.playersService.deletePlayer(socketClient, pseudo);
            this.webSocketServer.emit('updatePlayers', this.playersService.players);
        }
    }

    @SubscribeMessage('subscribeToApp')
    onSubscribe(socketClient: Object, pseudo: string): void {
        if (this.playersService.players.length < this.playersService.maxPlayers) {
            if (this.playersService.players.some((player: Player) => pseudo === player.pseudo)) {
                this.webSocketServer.emit('isConnected', 'Le pseudo ' + pseudo + ' est déjà pris :/');
            } else {
                this.webSocketServer.emit('isConnected', null);
                this.playersService.addPlayer(socketClient, pseudo);
                console.log(this.playersService.getPseudoFromPlayersMap(socketClient), 'connected');
                this.webSocketServer.emit('updatePlayers', this.playersService.players);

                if (this.playersService.players.length === this.playersService.maxPlayers) {
                    this.playersService.initPlayersUnanswered();
                    this.webSocketServer.emit('players-list-full', this.playersService.players);
                }
            }
        } else {
            this.webSocketServer.emit('isConnected', 'Trop tard, déso !');
        }
    }

    @SubscribeMessage('lieAnswered')
    lieAnswered(socketClient: Object, {lieValue, pseudo}: { lieValue: string, pseudo: string }): void {
        console.log('lie', lieValue, 'received from', pseudo);
        this.playersService.setPseudoInLiesMap(lieValue, pseudo);
        this.playersService.getLastPlayersUnanswer(pseudo);
        this.webSocketServer.emit('newAnswer', pseudo);
        this.nbAnswers++;
        if (this.nbAnswers === this.playersService.players.length) {
            this.nbAnswers = 0;
            this.playersService.setPseudoInLiesMap(this.questionsService.getAnswers()[0], 'truth');

            if (this.playersService.getLiesMapSize() <= this.playersService.players.length) {
                // if same lies
                this.setGameLies();
            }

            console.log('all lies sent', this.playersService.getLiesMap());
            this.webSocketServer.emit('goToAnswering');
        }
    }

    @SubscribeMessage('lieChoosen')
    lieChoosen(socketClient: Object, answer: Answer): void {
        console.log('lie choosen by', answer.pseudo, ':', answer.lie);
        this.playersService.setPseudoInAnswersMap(answer.lie.value, answer.pseudo);
        this.nbAnswers++;
        this.webSocketServer.emit('newAnswer', answer.pseudo);
        if (this.nbAnswers === this.playersService.players.length) {
            this.nbAnswers = 0;
            this.webSocketServer.emit('goToResults', {
                results: this.playersService.calculateResults(),
                scores: this.playersService.calculateScores(),
                nbRounds: this.nbRounds
            });
            this.playersService.endOfRound();
            this.questionsService.endOfRound();
            this.questionsService.nextQuestion();
            if (this.nbRounds <= 7) {
                setTimeout(
                    () => {
                        this.webSocketServer.emit('nextQuestion');
                        this.nbRounds++;
                    },
                    10000);
            } else {
                this.webSocketServer.emit('gameOver');
            }
        }
    }

    private setGameLies(i: number = 0): void {
        if (this.playersService.getLiesMap().get(this.questionsService.getLies()[i]) === undefined) {
            this.playersService.setPseudoInLiesMap(this.questionsService.getLies()[i], 'gameLie');
        }
        if (this.playersService.getLiesMapSize() <= this.playersService.players.length) {
            i++;
            this.setGameLies(i);
        }
    }
}