import React from 'react';
import ApolloClient, { gql, InMemoryCache } from 'apollo-boost';
import { ApolloProvider, Query } from 'react-apollo'
import { makeStyles, Theme, WithStyles, useTheme } from '@material-ui/core/styles';
import { fromWei } from 'web3x-es/utils';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import './App.css';
import { StyleRules } from '@material-ui/styles';
import { TablePagination, TableFooter, IconButton } from '@material-ui/core';
import FirstPageIcon from '@material-ui/icons/FirstPage';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import LastPageIcon from '@material-ui/icons/LastPage';

if (!process.env.REACT_APP_GRAPHQL_ENDPOINT) {
  throw new Error('REACT_APP_GRAPHQL_ENDPOINT environment variable not defined')
}

const client = new ApolloClient({
  uri: process.env.REACT_APP_GRAPHQL_ENDPOINT,
  cache: new InMemoryCache(),
})

const TRANSFERS_QUERY = gql`
  query transfers {
    transfers(first: 100) {
      id
      wad
      src
      dst
    }
  }
`

type Transfer = {  
  id: string,
  wad: string,
  src: string,
  dst: string
}

interface Transfers {
  transfers: Array<Transfer>
}

const navigationStyles = makeStyles(theme => ({
  root: {
    flexShrink: 0,
    color: theme.palette.text.secondary,
    marginLeft: theme.spacing(2.5),
  },
}));

function TablePaginationActions(props: any) {
  const classes = navigationStyles();
  const theme = useTheme();
  const { count, page, rowsPerPage, onChangePage } = props;

  function handleFirstPageButtonClick(event: React.SyntheticEvent) {
    onChangePage(event, 0);
  }

  function handleBackButtonClick(event: React.SyntheticEvent) {
    onChangePage(event, page - 1);
  }

  function handleNextButtonClick(event: React.SyntheticEvent) {
    onChangePage(event, page + 1);
  }

  function handleLastPageButtonClick(event: React.SyntheticEvent) {
    onChangePage(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  }

  return (
    <div className={classes.root}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="First Page"
      >
        {theme.direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton onClick={handleBackButtonClick} disabled={page === 0} aria-label="Previous Page">
        {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="Next Page"
      >
        {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="Last Page"
      >
        {theme.direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
      </IconButton>
    </div>
  );
}

class Trades extends Query<Transfers>{}

type ClassKey = 'root' | 'table';

const useStyles = makeStyles((theme: Theme): StyleRules<{}, ClassKey> => ({
  root: {
    width: '80%',
    marginTop: theme.spacing(3),
    overflowX: 'auto',
  },
  table: {
    minWidth: 650,
  },
}));

type StyleClasses = Record<ClassKey,string>

type StyleClassesProps = {
  classes: StyleClasses
}

const TransfersComponent: React.FC<StyleClassesProps> = (props) => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const emptyRows = (transfers: Array<Transfer>) => rowsPerPage - Math.min(rowsPerPage, transfers.length - page * rowsPerPage);

  function handleChangePage(event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null, newPage:number) {
    setPage(newPage);
  }

  function handleChangeRowsPerPage(event: React.ChangeEvent<HTMLInputElement>) {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }
  return (
  <Trades query={TRANSFERS_QUERY}>
  {
    ({ data, error, loading}) => {
      console.log('Data', data)
      return loading ?
        <p>Loading...</p>
      : error ?
        <p>Error.</p>
      : 
      data && <Paper className={props.classes.root}>
      <Table className={props.classes.table}>
        <TableHead>
          <TableRow>
            <TableCell>From</TableCell>
            <TableCell>To</TableCell>
            <TableCell>Hash</TableCell>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
        {
          data.transfers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(({ src, dst, id, wad }) => (
            <TableRow key={id}>
              <TableCell>
                <a 
                  href={`https://etherscan.io/address/${src}`}
                  target="_blank"
                >
                  <code>{`${src.substr(0,10)}...${src.substr(src.length - 6, src.length)}`}</code>
                </a>
              </TableCell>
              <TableCell>
                <a
                  href={`https://etherscan.io/address/${dst}`}
                  target="_blank"
                >
                  <code>{`${dst.substr(0,10)}...${dst.substr(dst.length - 6, dst.length)}`}</code>
                </a>
              </TableCell>
              <TableCell>
                <a 
                  href={`https://etherscan.io/tx/${id.split('-')[0]}`}
                  target="_blank"
                >
                  <code>{`${id.substr(0,10)}...`}</code>
                </a>
              </TableCell>
              <TableCell>
                <span>{ Number(fromWei(wad, 'ether')).toFixed(2) }</span>
              </TableCell>
            </TableRow>
          ))
        }
        {
          emptyRows(data.transfers) > 0 && (
            <TableRow style={{ height: 48 * emptyRows(data.transfers) }}>
              <TableCell colSpan={6} />
            </TableRow>
          )
        }
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              colSpan={3}
              count={data.transfers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              SelectProps={{
                inputProps: { 'aria-label': 'Rows per page' },
                native: true,
              }}
              onChangePage={handleChangePage}
              onChangeRowsPerPage={handleChangeRowsPerPage}
              ActionsComponent={TablePaginationActions}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </Paper>
    }
  }
  </Trades>
)}


const App: React.FC = () => {
  const classes = useStyles();

  return (
    <ApolloProvider client={client}>
      <div className="App">
        <header className="App-header">
          <p>
            DAI Tracker
          </p>
          <TransfersComponent classes={classes} />
        </header>
      </div>
    </ApolloProvider>
  );
}

export default App;
