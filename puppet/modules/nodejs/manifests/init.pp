class nodejs::install {
	package {[
		'nodejs',
		'npm',
		'nodejs-legacy'
	]:
		ensure => installed,
	}

  exec { 'install grunt globally':
    subscribe => Package['npm'],
    command => 'npm install grunt-cli -g'
  }
}
