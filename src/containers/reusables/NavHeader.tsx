import NavHeader from '../../components/reusables/NavHeader';
import { StoreState } from '../../types';
import { connect } from 'react-redux';

const mapStateToProps = (state: StoreState) => {
    return {pseudo: state.pseudo};
};

export default connect(mapStateToProps, null)(NavHeader);