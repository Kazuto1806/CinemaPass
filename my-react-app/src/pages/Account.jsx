import "./Account.css";

function Account() {
  const userName = localStorage.getItem("userName");
  const userEmail = localStorage.getItem("userEmail");
  const phone = localStorage.getItem("phone");
  const role = localStorage.getItem("role");

  return (
    <main className="account-page">

      <div className="account-container">

        <h1>TÀI KHOẢN</h1>
      </div>

    </main>
  );
}

export default Account;