import './MovieCard.css'

function MovieCard({movie})
{
  return (
    <div className='movie-card'>
        {/* poster */}
        <img src={movie.image} alt={movie.alt} className='movie-poster'/>
        <div>
            {/*Thông tin khi hover*/}
            <div className='movie-info'>
                <h3>{movie.title}</h3>
                <p>
                    <strong>Thể loại:</strong>{movie.genre}
                </p>
                <p>
                    <strong>Thời lượng:</strong>{movie.duration}
                </p>
                <p>
                    <strong>Khởi chiếu:</strong>{movie.releaseDate}
                </p>
                <p>
                    <strong>Đạo diễn</strong>{director}
                </p>
            </div>
            <button className='movie-detail-btn'>
                Xem chi tiết
            </button>
        </div>
        <div className='movie-badget'>
            {movie.age}
        </div>
    </div>
  );
}

export default MovieCard