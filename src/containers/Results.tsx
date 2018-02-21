import Results from '../components/Results';
import { StoreState } from '../types';
import { connect } from 'react-redux';

const mapStateToProps = (state: StoreState) => {
    return {
        pseudo: state.pseudo,
        results: state.results,
        scores: state.scores,
        nbRounds: state.nbRounds
    };
};

export default connect(mapStateToProps, null)(Results);